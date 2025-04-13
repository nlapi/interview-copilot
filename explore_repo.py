#!/usr/bin/env python3

import os
import json
import subprocess
import re

def get_git_info():
    """Get git repository information"""
    try:
        # Get the remote URL
        remote_url = subprocess.check_output(
            ["git", "config", "--get", "remote.origin.url"], 
            universal_newlines=True
        ).strip()
        
        # Get the current branch
        current_branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], 
            universal_newlines=True
        ).strip()
        
        # Get the latest commit
        latest_commit = subprocess.check_output(
            ["git", "log", "-1", "--pretty=%H"], 
            universal_newlines=True
        ).strip()
        
        return {
            "remote_url": remote_url,
            "current_branch": current_branch,
            "latest_commit": latest_commit
        }
    except subprocess.CalledProcessError:
        return {"error": "Failed to get git information"}

def find_readme_content():
    """Find and return the content of the README file"""
    readme_files = ["README.md", "README", "readme.md", "readme"]
    
    for readme in readme_files:
        if os.path.exists(readme):
            with open(readme, 'r', encoding='utf-8') as f:
                return f.read()
    
    return "No README file found."

def explore_directory_structure(root_dir='.', max_depth=4, current_depth=0):
    """Recursively explore directory structure up to a maximum depth"""
    structure = []
    
    try:
        for item in os.listdir(root_dir):
            path = os.path.join(root_dir, item)
            
            # Skip hidden files and directories
            if item.startswith('.') and item != '.env.example':
                continue
                
            if os.path.isdir(path):
                if current_depth < max_depth:
                    structure.append({
                        "type": "directory",
                        "name": item,
                        "path": path,
                        "contents": explore_directory_structure(path, max_depth, current_depth + 1)
                    })
                else:
                    structure.append({
                        "type": "directory",
                        "name": item,
                        "path": path,
                        "contents": ["Max depth reached"]
                    })
            else:
                structure.append({
                    "type": "file",
                    "name": item,
                    "path": path
                })
    except Exception as e:
        return [{"error": str(e)}]
    
    return structure

def detect_project_type():
    """Detect the type of project based on files"""
    project_type = []
    
    if os.path.exists("package.json"):
        with open("package.json", 'r') as f:
            try:
                package_data = json.load(f)
                dependencies = list(package_data.get("dependencies", {}).keys())
                dev_dependencies = list(package_data.get("devDependencies", {}).keys())
                
                if "react" in dependencies:
                    project_type.append("React")
                if "vue" in dependencies:
                    project_type.append("Vue.js")
                if "angular" in dependencies or "@angular/core" in dependencies:
                    project_type.append("Angular")
                if "express" in dependencies:
                    project_type.append("Express.js")
                if "next" in dependencies:
                    project_type.append("Next.js")
                
                project_type.append("Node.js")
            except json.JSONDecodeError:
                project_type.append("Node.js (package.json parse error)")
    
    if os.path.exists("requirements.txt"):
        with open("requirements.txt", 'r') as f:
            content = f.read()
            if "django" in content.lower():
                project_type.append("Django")
            if "flask" in content.lower():
                project_type.append("Flask")
            if "fastapi" in content.lower():
                project_type.append("FastAPI")
            
            project_type.append("Python")
    
    if os.path.exists("go.mod"):
        project_type.append("Go")
    
    if len(project_type) == 0:
        project_type.append("Unknown")
    
    return project_type

def find_entry_points():
    """Find potential entry points for the application"""
    entry_points = []
    
    # Check for package.json scripts
    if os.path.exists("package.json"):
        with open("package.json", 'r') as f:
            try:
                package_data = json.load(f)
                scripts = package_data.get("scripts", {})
                
                if "start" in scripts:
                    entry_points.append(f"npm start: {scripts['start']}")
                if "dev" in scripts:
                    entry_points.append(f"npm run dev: {scripts['dev']}")
                if "serve" in scripts:
                    entry_points.append(f"npm run serve: {scripts['serve']}")
            except json.JSONDecodeError:
                entry_points.append("Failed to parse package.json")
    
    # Check for Python entry points
    python_files = []
    for root, _, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'if __name__ == "__main__"' in content or "if __name__ == '__main__'" in content:
                        python_files.append(file_path)
    
    if python_files:
        entry_points.append("Python entry points:")
        for file in python_files:
            entry_points.append(f"  - python {file}")
    
    return entry_points

def find_env_variables():
    """Find environment variables used in the project"""
    env_vars = set()
    
    # Check .env.example file
    if os.path.exists(".env.example"):
        with open(".env.example", 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key = line.split('=')[0]
                    env_vars.add(key)
    
    # Look for process.env in JavaScript files
    js_env_pattern = re.compile(r'process\.env\.([A-Z_][A-Z0-9_]*)', re.IGNORECASE)
    
    # Look for os.getenv/os.environ in Python files
    py_env_pattern1 = re.compile(r'os\.getenv\([\'"]([A-Z_][A-Z0-9_]*)[\'"]', re.IGNORECASE)
    py_env_pattern2 = re.compile(r'os\.environ\[[\'"]([A-Z_][A-Z0-9_]*)[\'"]', re.IGNORECASE)
    
    for root, _, files in os.walk('.'):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        for match in js_env_pattern.finditer(content):
                            env_vars.add(match.group(1))
                except:
                    pass
            
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        for match in py_env_pattern1.finditer(content):
                            env_vars.add(match.group(1))
                        for match in py_env_pattern2.finditer(content):
                            env_vars.add(match.group(1))
                except:
                    pass
    
    return sorted(list(env_vars))

def create_project_report():
    """Create a report about the project structure and dependencies"""
    git_info = get_git_info()
    readme_content = find_readme_content()
    structure = explore_directory_structure()
    project_type = detect_project_type()
    entry_points = find_entry_points()
    env_variables = find_env_variables()
    
    report = {
        "git_info": git_info,
        "project_type": project_type,
        "entry_points": entry_points,
        "environment_variables": env_variables,
        "directory_structure": structure
    }
    
    # Create human-readable README.md
    with open("README.md", 'w', encoding='utf-8') as f:
        f.write("# Interview Copilot - Project Analysis\n\n")
        
        f.write("## Repository Information\n")
        if "error" not in git_info:
            f.write(f"- Remote URL: {git_info['remote_url']}\n")
            f.write(f"- Branch: {git_info['current_branch']}\n")
            f.write(f"- Latest Commit: {git_info['latest_commit']}\n")
        else:
            f.write(f"- Error: {git_info['error']}\n")
        
        f.write("\n## Project Type\n")
        for pt in project_type:
            f.write(f"- {pt}\n")
        
        f.write("\n## Entry Points\n")
        if entry_points:
            for ep in entry_points:
                f.write(f"- {ep}\n")
        else:
            f.write("No obvious entry points found.\n")
        
        f.write("\n## Environment Variables\n")
        if env_variables:
            for ev in env_variables:
                f.write(f"- {ev}\n")
        else:
            f.write("No environment variables found.\n")
        
        f.write("\n## Original README Content\n")
        f.write("```\n")
        f.write(readme_content)
        f.write("\n```\n")
        
        f.write("\n## Directory Structure\n")
        f.write("```\n")
        
        def print_structure(items, indent=0):
            for item in items:
                if item['type'] == 'directory':
                    f.write(f"{' ' * indent}📁 {item['name']}/\n")
                    if isinstance(item['contents'], list):
                        print_structure(item['contents'], indent + 2)
                else:
                    f.write(f"{' ' * indent}📄 {item['name']}\n")
        
        print_structure(structure)
        f.write("```\n")
    
    # Also save detailed JSON for further processing if needed
    with open("project_analysis.json", 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

if __name__ == "__main__":
    create_project_report()
    print("Analysis complete! Check README.md for project information.")
