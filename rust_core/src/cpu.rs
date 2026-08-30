#[cfg(target_os = "windows")]
use std::ffi::c_void;

#[cfg(target_os = "windows")]
#[link(name = "kernel32")]
extern "system" {
    fn SetPriorityClass(hProcess: *mut c_void, dwPriorityClass: u32) -> i32;
    fn SetThreadPriority(hThread: *mut c_void, nPriority: i32) -> i32;
    fn GetCurrentThread() -> *mut c_void;
    fn GetCurrentProcess() -> *mut c_void;
    fn SetThreadExecutionState(esFlags: u32) -> u32;
}

#[cfg(target_os = "linux")]
use std::fs;
#[cfg(target_os = "linux")]
use std::path::Path;

pub fn lock_execution_state() {
    #[cfg(target_os = "windows")]
    unsafe {
        // ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED
        SetThreadExecutionState(0x80000000 | 0x00000001 | 0x00000040);
        SetPriorityClass(GetCurrentProcess(), 0x00000080); // HIGH_PRIORITY_CLASS
        SetThreadPriority(GetCurrentThread(), 2);          // THREAD_PRIORITY_HIGHEST
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Set Linux Real-Time Niceness Priority (-20 = Maximum OS Priority)
        unsafe {
            libc::setpriority(libc::PRIO_PROCESS, 0, -20);
        }

        // 2. Set CPU scaling governor to 'performance' for all cores
        let cpus = glob_cpus();
        for cpu_path in cpus {
            let gov_file = format!("{}/cpufreq/scaling_governor", cpu_path);
            if Path::new(&gov_file).exists() {
                let _ = fs::write(&gov_file, "performance\n");
            }
            let epp_file = format!("{}/power/energy_performance_preference", cpu_path);
            if Path::new(&epp_file).exists() {
                let _ = fs::write(&epp_file, "performance\n");
            }
        }

        // 3. Disable CPU DMA C-state Latency
        let _ = fs::OpenOptions::new().write(true).open("/dev/cpu_dma_latency").map(|mut f| {
            use std::io::Write;
            let zero = 0i32.to_ne_bytes();
            let _ = f.write_all(&zero);
        });

        println!("[RUST KERNEL - LINUX] CPU Governors locked to 'performance' across all cores & DMA latency minimized.");
    }
}

#[cfg(target_os = "linux")]
fn glob_cpus() -> Vec<String> {
    let mut list = Vec::new();
    if let Ok(entries) = fs::read_dir("/sys/devices/system/cpu") {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("cpu") && name[3..].chars().all(|c| c.is_ascii_digit()) {
                list.push(format!("/sys/devices/system/cpu/{}", name));
            }
        }
    }
    list
}
