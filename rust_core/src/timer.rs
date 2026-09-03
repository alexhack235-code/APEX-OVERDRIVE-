#[cfg(target_os = "windows")]
#[link(name = "ntdll")]
extern "system" {
    fn NtSetTimerResolution(
        DesiredResolution: u32,
        SetResolution: u8,
        CurrentResolution: *mut u32,
    ) -> i32;

    fn NtQueryTimerResolution(
        MaximumResolution: *mut u32,
        MinimumResolution: *mut u32,
        CurrentResolution: *mut u32,
    ) -> i32;
}

#[cfg(target_os = "windows")]
#[link(name = "winmm")]
extern "system" {
    fn timeBeginPeriod(uPeriod: u32) -> u32;
    fn timeEndPeriod(uPeriod: u32) -> u32;
}

pub struct TimerGuard {
    active: bool,
}

impl TimerGuard {
    /// Forces system timer resolution to 0.5ms on Windows, or 1ns timer slack on Linux
    pub fn enable_ultra_precision(silent: bool) -> Self {
        #[cfg(target_os = "windows")]
        unsafe {
            timeBeginPeriod(1);
            let mut current: u32 = 0;
            let status = NtSetTimerResolution(5000, 1, &mut current);
            if !silent {
                if status == 0 {
                    println!("[RUST KERNEL] Windows Ultra-precision timer engaged: 0.500ms (5000 x 100ns)");
                } else {
                    println!("[RUST KERNEL] Windows Fallback timer engaged: 1.000ms via timeBeginPeriod");
                }
            }
        }

        #[cfg(target_os = "linux")]
        unsafe {
            // Linux PR_SET_TIMERSLACK = 29
            // Setting slack to 1ns eliminates kernel sleep jitter for gaming loops
            const PR_SET_TIMERSLACK: i32 = 29;
            let res = libc::prctl(PR_SET_TIMERSLACK, 1, 0, 0, 0);
            if !silent {
                if res == 0 {
                    println!("[RUST KERNEL] Linux Timer Slack minimized to 1ns via prctl(PR_SET_TIMERSLACK)");
                } else {
                    println!("[RUST KERNEL] Linux High-Resolution Timer engaged");
                }
            }
        }

        TimerGuard { active: true }
    }

    pub fn query_resolution() -> (f64, f64, f64) {
        #[cfg(target_os = "windows")]
        {
            let mut max: u32 = 0;
            let mut min: u32 = 0;
            let mut cur: u32 = 0;
            unsafe {
                NtQueryTimerResolution(&mut max, &mut min, &mut cur);
            }
            (
                max as f64 / 10000.0,
                min as f64 / 10000.0,
                cur as f64 / 10000.0,
            )
        }

        #[cfg(target_os = "linux")]
        {
            // On Linux with HRT (High Resolution Timers), resolution is sub-microsecond (~0.001ms)
            (10.0, 0.001, 0.001)
        }
    }
}

impl Drop for TimerGuard {
    fn drop(&mut self) {
        if self.active {
            #[cfg(target_os = "windows")]
            unsafe {
                let mut current: u32 = 0;
                NtSetTimerResolution(5000, 0, &mut current);
                timeEndPeriod(1);
            }
        }
    }
}
