using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

// Define Assembly Information for the executable (Version 1.3)
[assembly: AssemblyTitle("Audiobook Generator with AI")]
[assembly: AssemblyDescription("AI-Powered Audiobook Generator Launcher")]
[assembly: AssemblyCompany("Audiobook Generator")]
[assembly: AssemblyProduct("Audiobook Generator with AI")]
[assembly: AssemblyCopyright("Copyright © 2026")]
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]

namespace AudiobookLauncher
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// Starts the Electron application silently via command prompt.
        /// </summary>
        [STAThread]
        static void Main()
        {
            // Get the directory where this executable is located
            string targetDir = AppDomain.CurrentDomain.BaseDirectory;
            
            // Setup the process to run the electron app
            Process process = new Process();
            process.StartInfo.FileName = "cmd.exe";
            process.StartInfo.Arguments = "/c npx electron electron-main.cjs";
            process.StartInfo.WorkingDirectory = targetDir;
            
            // Hide the command prompt window from the user
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            
            // Launch the application
            process.Start();
        }
    }
}
