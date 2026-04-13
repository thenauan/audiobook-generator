using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Net;

namespace AudiobookInstaller
{
    public class InstallerForm : Form
    {
        private Label lblStatus;
        private ProgressBar progressBar;
        private Button btnInstall;

        public InstallerForm()
        {
            this.Text = "Audiobook Generator - Instalador";
            this.Size = new Size(400, 200);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            Label lblTitle = new Label();
            lblTitle.Text = "Instalador do Audiobook Generator";
            lblTitle.Font = new Font("Segoe UI", 12, FontStyle.Bold);
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(20, 20);
            this.Controls.Add(lblTitle);

            lblStatus = new Label();
            lblStatus.Text = "Clique em Instalar para baixar as dependências e criar o atalho.";
            lblStatus.AutoSize = true;
            lblStatus.Location = new Point(20, 50);
            this.Controls.Add(lblStatus);

            progressBar = new ProgressBar();
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 0; // Stopped
            progressBar.Location = new Point(20, 80);
            progressBar.Size = new Size(340, 20);
            this.Controls.Add(progressBar);

            btnInstall = new Button();
            btnInstall.Text = "Instalar";
            btnInstall.Location = new Point(260, 115);
            btnInstall.Size = new Size(100, 30);
            btnInstall.Click += BtnInstall_Click;
            this.Controls.Add(btnInstall);
        }

        private async void BtnInstall_Click(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            progressBar.MarqueeAnimationSpeed = 30;
            
            try {
                lblStatus.Text = "Verificando dependências do sistema (Node e Python)...";
                await CheckAndInstallDependencies();

                lblStatus.Text = "Instalando dependências do Node.js (Isso pode demorar)...";
                await RunCommand("npm", "install howler @types/howler electron");
                await RunCommand("npm", "install");

                lblStatus.Text = "Instalando dependências do Python...";
                await RunCommand("python", "-m pip install ebooklib beautifulsoup4 pypdf mobi deep-translator langdetect mutagen edge-tts tqdm colorama");

                lblStatus.Text = "Criando atalhos...";
                CreateShortcut();

                progressBar.MarqueeAnimationSpeed = 0;
                progressBar.Value = 100;
                lblStatus.Text = "Instalação concluída com sucesso!";
                MessageBox.Show("Aplicativo instalado! Um atalho foi criado na sua Área de Trabalho.", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            } 
            catch (Exception ex) {
                progressBar.MarqueeAnimationSpeed = 0;
                MessageBox.Show("Erro durante a instalação: " + ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnInstall.Enabled = true;
            }
        }

        private async System.Threading.Tasks.Task CheckAndInstallDependencies()
        {
            bool nodeInstalled = await CheckCommand("node", "-v");
            if (!nodeInstalled) {
                lblStatus.Text = "Baixando e instalando Node.js silenciosamente...";
                await DownloadAndInstall("https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi", "node_installer.msi", "/passive");
            }

            bool pythonInstalled = await CheckCommand("python", "--version");
            if (!pythonInstalled) {
                lblStatus.Text = "Baixando e instalando Python silenciosamente...";
                await DownloadAndInstall("https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe", "python_installer.exe", "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0");
            }
            
            // Atualiza as variáveis de ambiente ativas para a nossa sessão para prosseguir
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
            // Força compatibilidade com Tls12 (HTTPS atual) para evitar problemas no Download
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
            using (var client = new WebClient()) {
                await client.DownloadFileTaskAsync(new Uri(url), outFile);
            }
            Process p = new Process();
            p.StartInfo.FileName = outFile.EndsWith(".msi") ? "msiexec.exe" : outFile;
            p.StartInfo.Arguments = outFile.EndsWith(".msi") ? string.Format("/i {0} {1}", outFile, args) : args;
            p.StartInfo.CreateNoWindow = true;
            p.StartInfo.UseShellExecute = false;
            p.Start();
            await System.Threading.Tasks.Task.Run(() => p.WaitForExit());
            if (File.Exists(outFile)) File.Delete(outFile);
        }

        private System.Threading.Tasks.Task RunCommand(string filename, string args)
        {
            var tcs = new System.Threading.Tasks.TaskCompletionSource<bool>();
            Process process = new Process();
            process.StartInfo.FileName = filename == "npm" ? "cmd.exe" : filename;
            process.StartInfo.Arguments = filename == "npm" ? "/c npm " + args : args;
            process.StartInfo.WorkingDirectory = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
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

        private async void CreateShortcut()
        {
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            string exePath = Path.Combine(desktop, "Audiobook Generator.exe");
            string targetDir = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
            string launcherCode = Path.Combine(targetDir, "AppLauncher.cs");
            string iconPath = Path.Combine(targetDir, "public", "icon.ico");
            
            if (File.Exists(launcherCode)) {
                string compileArgs = string.Format("/target:winexe /out:\"{0}\" \"{1}\"", exePath, launcherCode);
                if (File.Exists(iconPath)) {
                    compileArgs = string.Format("/target:winexe /win32icon:\"{0}\" /out:\"{1}\" \"{2}\"", iconPath, exePath, launcherCode);
                }
                await RunCommand(@"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe", compileArgs);
            }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}