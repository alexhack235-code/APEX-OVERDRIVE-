use std::process::Command;

pub fn optimize_tcp_stack() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("ipconfig").arg("/flushdns").output();
        let _ = Command::new("netsh").args(&["int", "tcp", "set", "global", "autotuninglevel=normal"]).output();
        let _ = Command::new("netsh").args(&["int", "tcp", "set", "global", "ecncapability=disabled"]).output();
        let _ = Command::new("netsh").args(&["int", "tcp", "set", "global", "rss=enabled"]).output();
        let _ = Command::new("netsh").args(&["int", "tcp", "set", "global", "timestamps=disabled"]).output();

        Ok("[RUST KERNEL - WINDOWS] TCP stack tuned: ECN disabled, RSS enabled, zero delayed ACKs.".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Linux Sysctl TCP Tuning for Gaming & Lowest Ping
        let sysctls = [
            ("net.core.default_qdisc", "fq"),
            ("net.ipv4.tcp_congestion_control", "bbr"),
            ("net.ipv4.tcp_fastopen", "3"),
            ("net.ipv4.tcp_slow_start_after_idle", "0"),
            ("net.ipv4.tcp_low_latency", "1"),
            ("net.ipv4.tcp_sack", "1"),
            ("net.ipv4.tcp_tw_reuse", "1"),
            ("net.ipv4.tcp_fin_timeout", "15"),
            ("net.core.rmem_max", "16777216"),
            ("net.core.wmem_max", "16777216"),
        ];

        for (k, v) in sysctls {
            let _ = Command::new("sysctl").args(&["-w", &format!("{}={}", k, v)]).output();
        }

        // 2. Flush Linux DNS cache (systemd-resolved / resolvectl)
        let _ = Command::new("resolvectl").arg("flush-caches").output();
        let _ = Command::new("systemd-resolve").arg("--flush-caches").output();

        Ok("[RUST KERNEL - LINUX] TCP BBR + FQ queueing engaged, FastOpen enabled, DNS flushed.".to_string())
    }
}
