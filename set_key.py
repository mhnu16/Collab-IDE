import os
import getpass

def main():
    root = os.path.dirname(os.path.abspath(__file__))

    key = getpass.getpass("Enter the key: ")
    with open(os.path.join(root, "backend", "src", "security", ".key"), "w") as f:
        f.write(key)

    with open(os.path.join(root, "frontend", "security", ".key"), "w") as f:
        f.write(key)

    print("Key set successfully")


if __name__ == "__main__":
    main()
