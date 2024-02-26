import os


def main(dev_mode=False):
    root = os.path.dirname(os.path.abspath(__file__))
    cmd_prefix = "start cmd /k "

    if dev_mode:
        print("Starting in development mode")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = "npm run dev"
        os.system(cmd_prefix + vit_cmd)

        os.chdir(os.path.join(root, "backend", "src"))
        py_cmd = "python main.py"
        os.system(cmd_prefix + py_cmd)

    else:
        print("Starting in production mode")

        # Starts up the web server, via Vite
        os.chdir(os.path.join(root, "frontend"))
        vit_cmd = '"npm run build && npm run preview"'
        os.system(cmd_prefix + vit_cmd)

        os.chdir(os.path.join(root, "backend", "src"))
        py_cmd = "python main.py"
        os.system(cmd_prefix + py_cmd)


if __name__ == "__main__":
    main(dev_mode=True)
