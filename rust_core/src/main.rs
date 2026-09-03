mod timer;
mod memory;
mod cpu;
mod network;

use std::env;
use std::time::Duration;
use std::thread;

fn get_os_name() -> &'static str {
    #[cfg(target_os = "linux")]
    return "Linux";
    #[cfg(target_os = "windows")]
    return "Windows";
    #[cfg(target_os = "macos")]
    return "macOS";
    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    return "Generic POSIX";
}

fn print_banner() {
    println!("================================================================");
    println!("  ⚡ APEX RUST CORE // UNIVERSAL OS KERNEL ACCELERATOR ⚡     ");
    println!("  Target OS: {} | Sub-ms Timer | Cache Purge | TCP BBR/NoDelay", get_os_name());
    println!("================================================================");
}

fn execute_overdrive(json_mode: bool) {
    if !json_mode {
        print_banner();
        println!("[1/4] Locking CPU governors & thread execution state...");
    }
    cpu::lock_execution_state();

    if !json_mode {
        println!("[2/4] Purging OS Kernel Page & Standby memory caches...");
    }
    let mem_res = memory::purge_standby_list().unwrap_or_else(|e| e);

    if !json_mode {
        println!("[3/4] Optimizing TCP stack & DNS resolver cache...");
    }
    let net_res = network::optimize_tcp_stack().unwrap_or_else(|e| e);

    if !json_mode {
        println!("[4/4] Engaging ultra-precision kernel timer resolution...");
    }
    let _timer_guard = timer::TimerGuard::enable_ultra_precision(json_mode);
    let (max_t, min_t, cur_t) = timer::TimerGuard::query_resolution();

    if json_mode {
        println!(
            "{{\"success\":true,\"os\":\"{}\",\"engine\":\"rust_kernel\",\"timer_ms\":{:.3},\"memory_purge\":\"{}\",\"network_opt\":\"{}\"}}",
            get_os_name(), cur_t, mem_res, net_res
        );
    } else {
        println!("\n✅ [STATUS] Deep Rust Kernel Overdrive ACTIVE on {}!", get_os_name());
        println!("   Timer Resolution: Current = {:.3}ms (Min = {:.3}ms, Max = {:.3}ms)", cur_t, min_t, max_t);
        println!("   Memory Purge: {}", mem_res);
        println!("   Network Stack: {}", net_res);
        println!("   Press Ctrl+C to exit or keep running in background.");
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let json_mode = args.iter().any(|a| a == "--json");
    let is_daemon = args.iter().any(|a| a == "--daemon");
    let is_purge = args.iter().any(|a| a == "--purge-memory");
    let is_timer = args.iter().any(|a| a == "--timer-only");

    if is_purge {
        let res = memory::purge_standby_list().unwrap_or_else(|e| e);
        if json_mode {
            println!("{{\"success\":true,\"os\":\"{}\",\"message\":\"{}\"}}", get_os_name(), res);
        } else {
            println!("{}", res);
        }
        return;
    }

    if is_timer {
        let _guard = timer::TimerGuard::enable_ultra_precision(json_mode);
        let (_, _, cur_t) = timer::TimerGuard::query_resolution();
        if json_mode {
            println!("{{\"success\":true,\"os\":\"{}\",\"timer_ms\":{:.3}}}", get_os_name(), cur_t);
        } else {
            println!("[RUST KERNEL] Timer locked at {:.3}ms on {}", cur_t, get_os_name());
        }
        if is_daemon {
            loop {
                thread::sleep(Duration::from_secs(60));
            }
        }
        return;
    }

    execute_overdrive(json_mode);

    if is_daemon {
        let _guard = timer::TimerGuard::enable_ultra_precision(json_mode);
        loop {
            thread::sleep(Duration::from_secs(60));
        }
    }
}
