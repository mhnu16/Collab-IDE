import os
import zipfile
import requests
import io


def get_latest_nginx_version():
    # Fetch the HTML page where the latest Nginx version is listed
    url = 'https://nginx.org/en/download.html'
    response = requests.get(url)
    
    # Extract the version number from the HTML content
    # This regex pattern looks for the string "nginx-" followed by the version number
    import re
    match = re.search(r'nginx-(\d+\.\d+\.\d+)', response.text)
    if match:
        return match.group(1)
    else:
        print("Failed to extract Nginx version.")
        return None

def download_nginx(version):
    # Download the Nginx source code
    url = f'https://nginx.org/download/nginx-{version}.zip'
    response = requests.get(url)

    # unzips the downloaded response
    root = os.path.dirname(os.path.abspath(__file__))
    zipfile.ZipFile(io.BytesIO(response.content)).extractall(root)

def install_dependencies():
    root = os.path.dirname(os.path.abspath(__file__))
    cmd_prefix = "start cmd /k "

    # Install Python and Node.js dependencies
    os.system(cmd_prefix + "pip install -r requirements.txt")
    os.system(cmd_prefix + "npm install")

    # Install Nginx
    version = get_latest_nginx_version()
    download_nginx(version)

if __name__ == "__main__":
    install_dependencies()
