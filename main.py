import os
import subprocess as sp
import sys
import ctypes


def check_dependency(cmd):
    try:
        sp.check_output(cmd, shell=True)
    except sp.CalledProcessError:
        print(f"Error: {cmd} not found. Please install it and try again.")
        exit(1)

def start(lst, cmd):
    if sys.platform == "win32":
        # Create a new console window
        ctypes.windll.kernel32.FreeConsole()
        ctypes.windll.kernel32.AllocConsole()

        # Start the process in the new console window
        p = sp.Popen(cmd, shell=True)

        ctypes.windll.kernel32.SetConsoleTitleW(f"{p.pid} - {cmd}")
        print(f"Started process with PID: {p.pid} and command: {cmd}")
        ctypes.windll.kernel32.FreeConsole()
        
        lst.append(p)

def main(dev_mode=False):
    root = os.path.dirname(os.path.abspath(__file__))

    # Check if the main dependencies are installed
    check_dependency("npm --version")
    check_dependency("python --version")
    check_dependency("nginx -v")

    processes = []

    if dev_mode:
        print("Starting in development mode")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = "npm run dev"
        start(processes, vit_cmd)

        os.chdir(os.path.join(root, "backend", "src"))
        py_cmd = "python main.py --dev"
        start(processes, py_cmd)

        os.chdir(os.path.join(root, "nginx-1.25.4"))
        nginx_conf_path = os.path.join(root, "nginx.conf")
        nginx_cmd = f"nginx -c {nginx_conf_path}"
        start(processes, nginx_cmd)

    else:
        print("Starting in production mode")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = '"npm run build && npm run preview"'
        start(processes, vit_cmd)

        os.chdir(os.path.join(root, "backend", "src"))
        py_cmd = "python main.py"
        start(processes, py_cmd)

        os.chdir(os.path.join(root, "nginx-1.25.4"))
        nginx_conf_path = os.path.join(root, "nginx.conf")
        nginx_cmd = f"nginx -c {nginx_conf_path}"
        start(processes, nginx_cmd)

    print(f"{' ':>10}Press Enter to stop the programs.{' ':<10}")
    input()

    nginx_stop_cmd = "nginx -s stop"
    os.system(nginx_stop_cmd)

    for process in processes:
        process.kill()





if __name__ == "__main__":
    main(dev_mode=True)
