using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using System.Net;
using System.Reflection;

// Define Assembly Information for the executable (Version 1.1)
[assembly: AssemblyTitle("Audiobook Generator with AI Installer")]
[assembly: AssemblyDescription("Installer for Audiobook Generator with AI")]
[assembly: AssemblyCompany("Audiobook Generator")]
[assembly: AssemblyProduct("Audiobook Generator with AI")]
[assembly: AssemblyCopyright("Copyright © 2026")]
[assembly: AssemblyVersion("1.1.0.0")]
[assembly: AssemblyFileVersion("1.1.0.0")]

namespace AudiobookInstaller
{
    public class InstallerForm : Form
    {
        private Label lblStatus;
        private Label lblInfo;
        private ProgressBar progressBar;
        private Button btnInstall;
        private CheckBox chkCreateShortcut;
        private CheckBox chkRunAfterInstall;

        public InstallerForm()
        {
            // Main Window Configuration
            this.Text = "Audiobook Generator with AI - Installer";
            this.Size = new Size(450, 310);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            // Title Label
            Label lblTitle = new Label();
            lblTitle.Text = "Audiobook Generator with AI Installer";
            lblTitle.Font = new Font("Segoe UI", 12, FontStyle.Bold);
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(20, 15);
            this.Controls.Add(lblTitle);

            // Information Label (Internet and Size warnings)
            lblInfo = new Label();
            lblInfo.Text = "Note: An active internet connection is required.\nThe installation will download approximately ~300MB\nof dependencies (Node.js, Python, and libraries).";
            lblInfo.ForeColor = Color.DimGray;
            lblInfo.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblInfo.AutoSize = true;
            lblInfo.Location = new Point(20, 50);
            this.Controls.Add(lblInfo);

            // Status Label
            lblStatus = new Label();
            lblStatus.Text = "Ready to install. Click 'Install' to begin.";
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblStatus.AutoSize = true;
            lblStatus.Location = new Point(20, 110);
            this.Controls.Add(lblStatus);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 0; // Stopped initially
            progressBar.Location = new Point(20, 135);
            progressBar.Size = new Size(390, 20);
            this.Controls.Add(progressBar);

            // Shortcut CheckBox
            chkCreateShortcut = new CheckBox();
            chkCreateShortcut.Text = "Create Desktop Shortcut";
            chkCreateShortcut.Checked = true;
            chkCreateShortcut.AutoSize = true;
            chkCreateShortcut.Location = new Point(20, 170);
            this.Controls.Add(chkCreateShortcut);

            // Run After Install CheckBox
            chkRunAfterInstall = new CheckBox();
            chkRunAfterInstall.Text = "Launch Application after installation";
            chkRunAfterInstall.Checked = true;
            chkRunAfterInstall.AutoSize = true;
            chkRunAfterInstall.Location = new Point(20, 195);
            this.Controls.Add(chkRunAfterInstall);

            // Install Button
            btnInstall = new Button();
            btnInstall.Text = "Install";
            btnInstall.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            btnInstall.Location = new Point(310, 225);
            btnInstall.Size = new Size(100, 35);
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);
        }

        private async void BtnInstall_Click(object sender, EventArgs e)
        {
            // Disable UI elements during installation
            btnInstall.Enabled = false;
            chkCreateShortcut.Enabled = false;
            chkRunAfterInstall.Enabled = false;
            progressBar.MarqueeAnimationSpeed = 30; // Start progress bar animation
            
            try {
                lblStatus.Text = "Checking system dependencies (Node.js and Python)...";
                await CheckAndInstallDependencies();

                lblStatus.Text = "Installing Node.js dependencies (This may take a while)...";
                await RunCommand("npm", "install");

                lblStatus.Text = "Installing Python dependencies (This may take a while)...";
                await RunCommand("python", "-m pip install ebooklib beautifulsoup4 pypdf pdfplumber mobi deep-translator langdetect mutagen edge-tts tqdm colorama faster-whisper");

                if (chkCreateShortcut.Checked)
                {
                    lblStatus.Text = "Creating Desktop Shortcut...";
                    CreateShortcut();
                }

                // Installation complete
                progressBar.MarqueeAnimationSpeed = 0;
                progressBar.Value = 100;
                lblStatus.Text = "Installation completed successfully!";
                
                MessageBox.Show("Application installed successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                if (chkRunAfterInstall.Checked)
                {
                    RunApp();
                }
                
                this.Close(); // Close installer
            } 
            catch (Exception ex) {
                // Handle any installation errors
                progressBar.MarqueeAnimationSpeed = 0;
                MessageBox.Show("Error during installation: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnInstall.Enabled = true;
                chkCreateShortcut.Enabled = true;
                chkRunAfterInstall.Enabled = true;
            }
        }

        private async System.Threading.Tasks.Task CheckAndInstallDependencies()
        {
            // Check if Node.js is installed
            bool nodeInstalled = await CheckCommand("node", "-v");
            if (!nodeInstalled) {
                lblStatus.Text = "Downloading and installing Node.js silently...";
                await DownloadAndInstall("https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi", "node_installer.msi", "/passive");
            }

            // Check if Python is installed
            bool pythonInstalled = await CheckCommand("python", "--version");
            if (!pythonInstalled) {
                lblStatus.Text = "Downloading and installing Python silently...";
                await DownloadAndInstall("https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe", "python_installer.exe", "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0");
            }
            
            // Check if FFmpeg is installed (needed for M4B, Opus, FLAC and WAV output and chapter encoding)
            bool ffmpegInstalled = await CheckCommand("ffmpeg", "-version");
            if (!ffmpegInstalled) {
                lblStatus.Text = "Installing FFmpeg (audio encoder)...";
                try {
                    await RunCommand("winget", "install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements --silent");
                } catch {
                    // Optional: without FFmpeg the app still exports MP3, but not M4B, Opus, FLAC or WAV
                    MessageBox.Show("FFmpeg could not be installed automatically. Install it from https://ffmpeg.org to export M4B, Opus, FLAC and WAV.", "FFmpeg", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }

            // Refresh environment PATH variables so the current process can see the newly installed tools
            string userPath = Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.User);
            string machinePath = Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.Machine);
            Environment.SetEnvironmentVariable("PATH", machinePath + ";" + userPath, EnvironmentVariableTarget.Process);
        }

        private async System.Threading.Tasks.Task<bool> CheckCommand(string filename, string args)
        {
            try {
                var p = Process.Start(new ProcessStartInfo { FileName = filename, Arguments = args, CreateNoWindow = true, UseShellExecute = false });
                await System.Threading.Tasks.Task.Run(() => p.WaitForExit());
                return p.ExitCode == 0;
            } catch { return false; }
        }

        private async System.Threading.Tasks.Task DownloadAndInstall(string url, string outFile, string args)
        {
            // Force TLS 1.2 to avoid download issues on older systems
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; 
            using (var client = new WebClient()) {
                await client.DownloadFileTaskAsync(new Uri(url), outFile);
            }
            
            // Execute the downloaded installer
            Process p = new Process();
            p.StartInfo.FileName = outFile.EndsWith(".msi") ? "msiexec.exe" : outFile;
            p.StartInfo.Arguments = outFile.EndsWith(".msi") ? string.Format("/i {0} {1}", outFile, args) : args;
            p.StartInfo.CreateNoWindow = true;
            p.StartInfo.UseShellExecute = false;
            p.Start();
            
            await System.Threading.Tasks.Task.Run(() => p.WaitForExit());
            
            // Cleanup the installer file
            if (File.Exists(outFile)) File.Delete(outFile);
        }

        private System.Threading.Tasks.Task RunCommand(string filename, string args)
        {
            var tcs = new System.Threading.Tasks.TaskCompletionSource<bool>();
            Process process = new Process();
            
            // Use cmd.exe to run npm, since npm is a batch script on Windows
            process.StartInfo.FileName = filename == "npm" ? "cmd.exe" : filename;
            process.StartInfo.Arguments = filename == "npm" ? "/c npm " + args : args;
            
            process.StartInfo.WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory;
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            process.EnableRaisingEvents = true;
            
            process.Exited += (s, e) => {
                if (process.ExitCode == 0) tcs.SetResult(true);
                else tcs.SetException(new Exception(string.Format("Command failed: {0} {1}", filename, args)));
            };
            
            process.Start();
            return tcs.Task;
        }

        private void CreateShortcut()
        {
            try {
                // Determine paths
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string shortcutPath = Path.Combine(desktop, "Audiobook Generator with AI.lnk");
                string targetDir = AppDomain.CurrentDomain.BaseDirectory;
                string targetPath = Path.Combine(targetDir, "Audiobook Generator with AI.exe");
                string iconPath = Path.Combine(targetDir, "public", "icon.ico");
                string vbsPath = Path.Combine(Path.GetTempPath(), "CreateShortcut.vbs");

                // Generate VBScript to create the standard Windows Shortcut (.lnk)
                string vbsContent = string.Format(@"
                    Set sh = CreateObject(""WScript.Shell"")
                    Set shortcut = sh.CreateShortcut(""{0}"")
                    shortcut.TargetPath = ""{1}""
                    shortcut.WorkingDirectory = ""{2}""
                    shortcut.IconLocation = ""{3}""
                    shortcut.Save
                ", shortcutPath, targetPath, targetDir, iconPath);

                File.WriteAllText(vbsPath, vbsContent);
                
                // Execute the VBScript silently
                var p = Process.Start(new ProcessStartInfo("cscript.exe", string.Format("//Nologo \"{0}\"", vbsPath)) { CreateNoWindow = true, UseShellExecute = false });
                p.WaitForExit();
                
                // Cleanup script
                File.Delete(vbsPath);
            } catch (Exception ex) {
                MessageBox.Show("Could not create shortcut: " + ex.Message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void RunApp()
        {
            try {
                string targetPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Audiobook Generator with AI.exe");
                if (File.Exists(targetPath)) {
                    Process.Start(new ProcessStartInfo(targetPath) { WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory });
                } else {
                    MessageBox.Show("Executable not found! Try running the app manually.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            } catch (Exception ex) {
                MessageBox.Show("Could not start app: " + ex.Message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
    }

    static class Program
    {
        /// <summary>
        /// The main entry point for the installer.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}