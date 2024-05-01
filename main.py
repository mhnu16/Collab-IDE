import os
import subprocess as sp


def check_dependency(cmd):
    try:
        output = sp.check_output(cmd, shell=True)
        print(f"Output: {output.decode()}")
    except sp.CalledProcessError:
        print(f"Error: {cmd} not found. Please install it and try again.")
        exit(1)


def start(lst, cmd):
    p = sp.Popen(["start", "powershell", "-NoExit", cmd], shell=True)
    print(f"Started process with PID: {p.pid} and command: {p.args}")
    lst.append(p)


def main(dev_mode=False):
    root = os.path.dirname(os.path.abspath(__file__))

    # Check if the main dependencies are installed
    check_dependency("npm --version")
    check_dependency("python --version")

    os.chdir(os.path.join(root, "nginx-1.25.4"))
    check_dependency("nginx -v")

    processes = []

    if dev_mode:
        print("Starting in development mode...")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = "npm run dev"
        start(processes, vit_cmd)

        os.chdir(os.path.join(root, "backend", "src", "python"))
        py_cmd = "python main.py --dev"
        start(processes, py_cmd)

        os.chdir(os.path.join(root, "backend", "src", "typescript"))
        ts_cmd = "tsc; if ($?) { node dist/server.cjs }"
        start(processes, ts_cmd)

        os.chdir(os.path.join(root, "nginx-1.25.4"))
        nginx_conf_path = os.path.join(root, "nginx.conf")
        nginx_cmd = f"./nginx -c {nginx_conf_path}"
        start(processes, nginx_cmd)

    else:
        print("Starting in production mode")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = "npm run build; if ($?) { npm run preview }"
        start(processes, vit_cmd)

        os.chdir(os.path.join(root, "backend", "src", "python"))
        py_cmd = "python main.py"
        start(processes, py_cmd)

        os.chdir(os.path.join(root, "backend", "src", "typescript"))
        ts_cmd = "tsc; if ($?) { node dist/server.cjs }"
        start(processes, ts_cmd)

        os.chdir(os.path.join(root, "nginx-1.25.4"))
        nginx_conf_path = os.path.join(root, "nginx.conf")
        nginx_cmd = f"./nginx -c {nginx_conf_path}"
        start(processes, nginx_cmd)

    print()
    print(f"{' ':>10}Press Enter to stop the nginx server.{' ':<10}")
    input()

    nginx_stop_cmd = "nginx -s stop"
    os.system(nginx_stop_cmd)

    print(
        f"{' ':>10}Close the associated terminal to close each respective process.{' ':<10}"
    )


if __name__ == "__main__":
    main(dev_mode=True)
