import os
import zipfile
import requests


def install_dependencies():
    root = os.path.dirname(os.path.abspath(__file__))
    cmd_prefix = "start cmd /k "

    backend_path = os.path.join(root, "backend", "src")
    frontend_path = os.path.join(root, "frontend")

    os.chdir(backend_path)
    os.system(cmd_prefix + "pip install -r requirements.txt")

    os.chdir(frontend_path)
    os.system(cmd_prefix + "npm install")


    # Download and install nginx
    nginx_file = "nginx-1.25.4" # Update this to the latest version
    nginx_url = f"https://nginx.org/download/{nginx_file}.zip"
    nginx_zip_path = os.path.join(root, f"{nginx_file}.zip")
    nginx_path = os.path.join(root, nginx_file)

    # Download nginx if it's not already downloaded
    if not os.path.exists(nginx_zip_path):
        response = requests.get(nginx_url)
        with open(nginx_zip_path, "wb") as f:
            f.write(response.content)

    # Extract nginx if it's not already extracted
    if not os.path.exists(nginx_path):
        with zipfile.ZipFile(nginx_zip_path, "r") as zip_ref:
            zip_ref.extractall(root)


if __name__ == "__main__":
    install_dependencies()
