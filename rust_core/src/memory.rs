#[cfg(target_os = "windows")]
use std::ffi::c_void;

#[cfg(target_os = "windows")]
#[link(name = "ntdll")]
extern "system" {
    fn NtSetSystemInformation(
        SystemInformationClass: u32,
        SystemInformation: *const c_void,
        SystemInformationLength: u32,
    ) -> i32;

    fn RtlAdjustPrivilege(
        Privilege: u32,
        Enable: u8,
        CurrentThread: u8,
        Enabled: *mut u8,
    ) -> i32;
}

#[cfg(target_os = "windows")]
#[link(name = "psapi")]
extern "system" {
    fn EmptyWorkingSet(hProcess: *mut c_void) -> i32;
}

#[cfg(target_os = "windows")]
#[link(name = "kernel32")]
extern "system" {
    fn OpenProcess(dwDesiredAccess: u32, bInheritHandle: i32, dwProcessId: u32) -> *mut c_void;
    fn CloseHandle(hObject: *mut c_void) -> i32;
    fn K32EnumProcesses(pProcessIds: *mut u32, cb: u32, pBytesReturned: *mut u32) -> i32;
}

#[cfg(target_os = "linux")]
use std::fs;
#[cfg(target_os = "linux")]
use std::process::Command;

pub fn purge_standby_list() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            let mut enabled: u8 = 0;
            RtlAdjustPrivilege(19, 1, 0, &mut enabled);
            RtlAdjustPrivilege(13, 1, 0, &mut enabled);

            let command: u32 = 4; // MEMORY_PURGE_STANDBY_LIST
            let status = NtSetSystemInformation(
                80, // SYSTEM_MEMORY_LIST_INFORMATION
                &command as *const u32 as *const c_void,
                std::mem::size_of::<u32>() as u32,
            );

            trim_windows_working_sets();

            if status == 0 {
                Ok("[RUST KERNEL - WINDOWS] Standby List Purged via NtSetSystemInformation(80, 4)".to_string())
            } else {
                Ok(format!("[RUST KERNEL - WINDOWS] Trimmed working sets (NT Status: {:#X})", status))
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Sync filesystems
        unsafe { libc::sync(); }

        // 2. Drop PageCache, dentries, and inodes via /proc/sys/vm/drop_caches
        let mut msg = String::new();
        if let Ok(_) = fs::write("/proc/sys/vm/drop_caches", "3\n") {
            msg.push_str("[RUST KERNEL - LINUX] PageCache, dentries & inodes dropped via drop_caches=3. ");
        } else {
            let _ = Command::new("sudo").args(&["sh", "-c", "echo 3 > /proc/sys/vm/drop_caches"]).status();
            msg.push_str("[RUST KERNEL - LINUX] Triggered drop_caches via sudo. ");
        }

        // 3. Compact memory to eliminate fragmentation stalls
        if let Ok(_) = fs::write("/proc/sys/vm/compact_memory", "1\n") {
            msg.push_str("RAM compacted for game allocators.");
        }

        // 4. Tune Linux VMM swappiness and cache pressure
        let _ = fs::write("/proc/sys/vm/swappiness", "10\n");
        let _ = fs::write("/proc/sys/vm/vfs_cache_pressure", "50\n");

        Ok(msg)
    }
}

#[cfg(target_os = "windows")]
fn trim_windows_working_sets() -> u32 {
    let mut pids = [0u32; 1024];
    let mut bytes_returned = 0u32;
    let mut count = 0;

    unsafe {
        if K32EnumProcesses(pids.as_mut_ptr(), std::mem::size_of_val(&pids) as u32, &mut bytes_returned) != 0 {
            let num_pids = bytes_returned as usize / std::mem::size_of::<u32>();
            for &pid in &pids[..num_pids] {
                if pid > 4 {
                    let handle = OpenProcess(0x0400 | 0x0020, 0, pid);
                    if !handle.is_null() {
                        EmptyWorkingSet(handle);
                        CloseHandle(handle);
                        count += 1;
                    }
                }
            }
        }
    }
    count
}
