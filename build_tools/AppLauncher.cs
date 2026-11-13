using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

[assembly: AssemblyTitle("Audiobook Generator with AI")]
[assembly: AssemblyDescription("AI-Powered Audiobook Generator Launcher")]
[assembly: AssemblyCompany("Audiobook Generator")]
[assembly: AssemblyProduct("Audiobook Generator with AI")]
[assembly: AssemblyCopyright("Copyright © 2026")]
[assembly: AssemblyVersion("1.6.2.0")]
[assembly: AssemblyFileVersion("1.6.2.0")]

namespace AudiobookLauncher
{
    static class Program
    {
        /// <summary>
        /// Abre o app. Usa o Electron já instalado na pasta do app (abre mais rápido e sem janela de terminal);
        /// sem ele, cai no "npx electron" de antes.
        /// </summary>
        [STAThread]
        static void Main()
        {
            string targetDir = AppDomain.CurrentDomain.BaseDirectory;
            string electron = Path.Combine(targetDir, "node_modules", "electron", "dist", "electron.exe");

            Process process = new Process();
            if (File.Exists(electron))
            {
                process.StartInfo.FileName = electron;
                process.StartInfo.Arguments = "electron-main.cjs";
            }
            else
            {
                process.StartInfo.FileName = "cmd.exe";
                process.StartInfo.Arguments = "/c npx electron electron-main.cjs";
            }
            process.StartInfo.WorkingDirectory = targetDir;
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            // Uma variável deixada por outro programa faria o Electron rodar como Node, sem abrir a janela
            process.StartInfo.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
            process.Start();
        }
    }
}
