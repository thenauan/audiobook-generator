using System;
using System.Diagnostics;
using System.IO;

namespace AudiobookLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string targetDir = AppDomain.CurrentDomain.BaseDirectory;
            Process process = new Process();
            process.StartInfo.FileName = "cmd.exe";
            process.StartInfo.Arguments = "/c npx electron electron-main.js";
            process.StartInfo.WorkingDirectory = targetDir;
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            process.Start();
        }
    }
}
