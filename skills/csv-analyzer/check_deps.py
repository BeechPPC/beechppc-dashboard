#!/usr/bin/env python3
"""
Dependency checker for CSV Analyzer skill.
Automatically installs missing dependencies.
"""

import subprocess
import sys
from pathlib import Path

REQUIRED_PACKAGES = [
    'pandas>=2.0.0',
    'matplotlib>=3.7.0',
    'seaborn>=0.12.0',
]

def check_import(package_name):
    """Check if a package can be imported."""
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False

def setup_environment():
    """Set up virtual environment and install dependencies."""
    skill_dir = Path(__file__).parent
    venv_dir = skill_dir / 'venv'

    print("🔧 Setting up CSV Analyzer environment...")

    # Check if venv exists
    if not venv_dir.exists():
        print(f"📦 Creating virtual environment at {venv_dir}")
        subprocess.run([sys.executable, '-m', 'venv', str(venv_dir)], check=True)

    # Determine pip path
    if sys.platform == 'win32':
        pip_path = venv_dir / 'Scripts' / 'pip'
    else:
        pip_path = venv_dir / 'bin' / 'pip'

    # Install requirements
    requirements_file = skill_dir / 'requirements.txt'
    if requirements_file.exists():
        print(f"📥 Installing dependencies from {requirements_file}")
        subprocess.run([str(pip_path), 'install', '-q', '-r', str(requirements_file)], check=True)
        print("✅ Dependencies installed successfully")

    return venv_dir

def get_python_path():
    """Get the Python executable path from venv."""
    skill_dir = Path(__file__).parent
    venv_dir = skill_dir / 'venv'

    if sys.platform == 'win32':
        python_path = venv_dir / 'Scripts' / 'python'
    else:
        python_path = venv_dir / 'bin' / 'python3'

    return str(python_path)

if __name__ == '__main__':
    # Check if running in venv
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

    if not in_venv:
        print("⚠️  Not running in virtual environment")
        setup_environment()
        print(f"\n✅ Setup complete!")
        print(f"   Python path: {get_python_path()}")
    else:
        # Check if packages are available
        missing = []
        for package in ['pandas', 'matplotlib', 'seaborn']:
            if not check_import(package):
                missing.append(package)

        if missing:
            print(f"⚠️  Missing packages: {', '.join(missing)}")
            print("   Run: pip install -r requirements.txt")
        else:
            print("✅ All dependencies are installed")
