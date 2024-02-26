import os


def install_dependencies():
    root = os.path.dirname(os.path.abspath(__file__))
    cmd_prefix = "start cmd /k "

    backend_path = os.path.join(root, "backend", "src")
    frontend_path = os.path.join(root, "frontend")

    os.chdir(backend_path)
    os.system(cmd_prefix + "pip install -r requirements.txt")

    os.chdir(frontend_path)
    os.system(cmd_prefix + "npm install")


if __name__ == "__main__":
    install_dependencies()
