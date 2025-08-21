# Load environment variables from .env file
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API keys from environment variables
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")

# Validate that required environment variables are set
if not AZURE_OPENAI_API_KEY:
    raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set. Please check your .env file.")
if not AZURE_OPENAI_ENDPOINT:
    raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is not set. Please check your .env file.")

import logging
from langchain_openai import AzureChatOpenAI
from datetime import datetime  # Local import to avoid polluting global namespace if not used elsewhere
import sys
import argparse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Contextual navigation playbook derived from product help docs
# Used to seed the LLM with role-appropriate first steps based on the doc file being processed
OMEGAAI_NAV_PLAYBOOK = {
    "0-Introduction": {
        "first_steps": [
            "Open the docs and read the Introduction (no in-app navigation required)."
        ]
    },
    "1-Getting-Started": {
        "first_steps": [
            "From the left navigation, open the area relevant to your task (e.g., Organization, User Profile, Logs).",
            "Follow the specific guide in Getting Started (e.g., add users, configure devices, set up forms)."
        ]
    },
    "2-OmegaAI-Homepage": {
        "first_steps": [
            "If you navigated away, click Home on the left navigation to return to the Homepage (Worklist)."
        ]
    },
    "3-Worklist": {
        "first_steps": [
            "You are already at the Worklist table."
        ]
    },
    "4-Scheduler": {
        "first_steps": [
            "Click the Calendar/Scheduler icon on the navigation bar to open the in-grid calendar.",
            "Use the date selector or view options as needed."
        ]
    },
    "5-Document-Viewer": {
        "first_steps": [
            "Click on a patient's name in the worklist table.",
            "Click on the Document Viewer button on the wheel that popped up."
        ]
    },
    "6-Image-Viewer": {
        "first_steps": [
            "Click on a patient's name in the worklist table.",
            "Click on the Image Viewer button on the wheel that popped up."
        ]
    },
    "7-Global-Search": {
        "first_steps": [
            "Click the search bar at the top of the Worklist.",
            "Type your query (e.g., patient, study, organization) and press Enter."
        ]
    },
    "8-Communication-and-Organization-Tools": {
        "Chat": {
            "first_steps": [
                "Click the Chat icon on the right-side navigation.",
                "Use the pencil icon to start a new chat if needed."
            ]
        },
        "Notifications": {
            "first_steps": [
                "Click the bell icon on the right-side navigation.",
                "Click a notification to navigate to the related page."
            ]
        },
        "Fax": {
            "first_steps": [
                "Left navigation → Logs.",
                "Click the circular log selector (bottom-right) → select Fax Log."
            ]
        },
        "User_Profile": {
            "first_steps": [
                "Left navigation → User Profile.",
                "Open User Settings to edit details if needed."
            ]
        }
    },
    "9-Root-Business-Analytics-and-Reporting": {
        "first_steps": [
            "Left navigation → My Apps.",
            "Click Root Business Analytics."
        ]
    },
    "10-Workflow-Automation": {
        "first_steps": [
            "Left navigation → My Apps (if available for your role).",
            "Click Workflow Automation; if not visible, use Global Search and type 'Workflow Automation'."
        ]
    },
    "11-OmegaAI-Link": {
        "first_steps": [
            "Left navigation → Organization.",
            "Open the Devices tab to manage/download OmegaAI Link."
        ]
    },
    "12-Advanced-Topics": {
        "Hanging_Protocols": {
            "first_steps": [
                "Open Image Viewer.",
                "Click the Hanging Protocol toolbar button, or use the three-dot menu → Settings → Hanging Protocols."
            ]
        },
        "Other_Topics": {
            "first_steps": [
                "Open the relevant module (Image Viewer or Document Viewer).",
                "Follow the specific topic’s steps in the docs."
            ]
        }
    },
    "13-Blume-Patient-Portal": {
        "first_steps": [
            "Left navigation → My Apps.",
            "Click Blume Patient Portal."
        ]
    }
}

# Fast path-based mapping from docs folders to playbook labels
PATH_LABEL_MAP = {
    "0-introduction": "0-Introduction",
    "1-getting-started": "1-Getting-Started",
    "2-omegaai-homepage": "2-OmegaAI-Homepage",
    "3-worklist": "3-Worklist",
    "4-scheduler": "4-Scheduler",
    "5-document-viewer": "5-Document-Viewer",
    "6-image-viewer": "6-Image-Viewer",
    "7-global-search": "7-Global-Search",
    "8-communication-and-organization-tools": "8-Communication-and-Organization-Tools",
    "9-root-business-analytics-and-reporting": "9-Root-Business-Analytics-and-Reporting",
    "10-workflow-automation": "10-Workflow-Automation",
    "11-omegaai-link": "11-OmegaAI-Link",
    "12-advanced-topics": "12-Advanced-Topics",
    "13-blume-patient-portal": "13-Blume-Patient-Portal",
}

def _normalize(text: str) -> str:
    """Lowercase and strip non-alphanumeric to spaces for keyword matching."""
    import re
    t = text.lower()
    t = re.sub(r"\d+\s*-\s*", "", t)  # drop leading ordinals like "3-"
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def _playbook_entries():
    """Flatten the playbook into (label, steps) entries including nested sections."""
    entries = []
    for key, value in OMEGAAI_NAV_PLAYBOOK.items():
        if isinstance(value, dict) and "first_steps" in value:
            entries.append((key, value["first_steps"]))
        if isinstance(value, dict):
            for subkey, subval in value.items():
                if isinstance(subval, dict) and "first_steps" in subval:
                    label = f"{key} {subkey}"
                    entries.append((label, subval["first_steps"]))
    return entries

def _get_steps_by_path(path_label: str) -> list[str]:
    """Get first steps for a top-level or nested playbook path.

    Examples: '6-Image-Viewer', '5-Document-Viewer',
              '8-Communication-and-Organization-Tools.Chat'
    """
    if not path_label:
        return []
    parts = path_label.split('.')
    node = OMEGAAI_NAV_PLAYBOOK
    for idx, part in enumerate(parts):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            return []
    if isinstance(node, dict) and 'first_steps' in node:
        return list(node['first_steps'])
    # Top-level section with first_steps
    if isinstance(node, list):
        return list(node)
    return []

def _normalize_path_for_docs(path: str) -> str:
    p = path.replace("\\", "/").lower()
    # Drop drive letters on Windows and collapse duplicate slashes
    try:
        import re
        p = re.sub(r"^[a-z]:", "", p)
        p = re.sub(r"/+", "/", p)
    except Exception:
        pass
    return p

def _detect_label_from_docs_path(file_path: str) -> str | None:
    """Detect playbook label from folder slug under docs/.

    Example matches:
    - */docs/6-Image-Viewer/myfile.md → '6-Image-Viewer'
    - */docs/5-Document-Viewer → '5-Document-Viewer'
    """
    p = _normalize_path_for_docs(file_path)
    for slug, label in PATH_LABEL_MAP.items():
        needle1 = f"/docs/{slug}/"
        needle2 = f"/docs/{slug}"
        if needle1 in p or p.endswith(needle2):
            return label
    return None

def detect_primary_label(file_path: str, file_content: str) -> str | None:
    """Detect the most relevant playbook section based on file metadata/content.

    Prefers exact, deterministic matches (e.g., Image Viewer, Document Viewer) over fuzzy.
    """
    # 1) Prefer direct docs path mapping (most deterministic)
    path_label = _detect_label_from_docs_path(file_path)
    if path_label:
        return path_label

    # 2) Fallback to content-based keyword detection
    text = f"{file_path}\n{file_content[:20000]}"
    t = _normalize(text)

    ordered_rules: list[tuple[list[str], str]] = [
        # Viewers
        (["image viewer", "imageviewer", "6 image viewer", "image viewer module"], "6-Image-Viewer"),
        (["document viewer", "documentviewer", "5 document viewer", "document viewer module"], "5-Document-Viewer"),
        # Worklist/Homepage
        (["worklist", "omega dial", "home page", "homepage", "work list"], "3-Worklist"),
        (["omegaai homepage", "omega ai homepage", "home"], "2-OmegaAI-Homepage"),
        # Scheduler
        (["scheduler", "calendar"], "4-Scheduler"),
        # Global search
        (["global search", "search bar"], "7-Global-Search"),
        # Communication & org tools
        (["chat"], "8-Communication-and-Organization-Tools.Chat"),
        (["notification", "notifications"], "8-Communication-and-Organization-Tools.Notifications"),
        (["fax"], "8-Communication-and-Organization-Tools.Fax"),
        (["user profile", "profile settings", "user settings"], "8-Communication-and-Organization-Tools.User_Profile"),
        # Analytics / automation / link
        (["root business analytics", "analytics and reporting"], "9-Root-Business-Analytics-and-Reporting"),
        (["workflow automation"], "10-Workflow-Automation"),
        (["omegaai link", "omega ai link", "devices tab"], "11-OmegaAI-Link"),
        # Advanced
        (["hanging protocol", "hanging protocols"], "12-Advanced-Topics.Hanging_Protocols"),
        # Getting started / intro / portal
        (["getting started"], "1-Getting-Started"),
        (["introduction"], "0-Introduction"),
        (["blume patient portal", "patient portal"], "13-Blume-Patient-Portal"),
    ]

    for keywords, label in ordered_rules:
        for kw in keywords:
            if kw in t:
                return label
    return None

def extract_first_steps_for_file(file_path: str, file_content: str) -> list[str]:
    """Return only the initial steps for the single best-matching section.

    This enforces the rule: if processing Image Viewer documentation, include Image Viewer first steps only.
    """
    label = detect_primary_label(file_path, file_content)
    return _get_steps_by_path(label) if label else []

def build_playbook_hints_for_changed_files(file_to_content: dict[str, str]) -> str:
    """Build a markdown section containing per-file contextual first steps (single best match per file)."""
    sections: list[str] = []
    for fpath, fcontent in file_to_content.items():
        label = detect_primary_label(fpath, fcontent)
        matched_steps = _get_steps_by_path(label) if label else []
        if matched_steps:
            bullets = "\n".join(f"- {s}" for s in matched_steps)
            human_label = label if label else "Detected Context"
            sections.append(f"### First Steps for {fpath} — {human_label}\n{bullets}")
    if not sections:
        return ""
    return "\n---\n## Contextual First Steps (auto-detected)\n" + "\n\n".join(sections) + "\n---\n"

def _extract_instructions_only(text: str) -> str:
    """Extract instruction lines from the LLM output within an INSTRUCTIONS section.
    
    Also attempts to parse the instructions as JSON if possible and logs both formats.
    If the response is in JSON format with "instructions" field, returns just that field.

    Strategy:
    - First try to parse the entire response as JSON and extract the "instructions" field
    - If not JSON, look for an explicit INSTRUCTIONS section
    - Include all lines within the INSTRUCTIONS section, not just numbered steps
    - If no INSTRUCTIONS section is found, return the original text trimmed
    - Try to parse instructions as JSON and log both formats
    """
    import re
    import json
    
    # First try to parse the entire text as JSON
    try:
        # Check if the entire text is valid JSON
        parsed_json = json.loads(text)
        if isinstance(parsed_json, dict) and "instructions" in parsed_json:
            print("Successfully parsed response as JSON with instructions field")
            print("\n--- PARSED JSON ---")
            print(json.dumps(parsed_json, indent=2))
            return parsed_json["instructions"]
    except json.JSONDecodeError:
        # Not a valid JSON, continue with section-based extraction
        pass
    except Exception as e:
        print(f"Error while processing initial JSON: {e}")
    
    lines = text.splitlines()

    # Check if there's an INSTRUCTIONS section
    instructions_start_idx = -1
    instructions_end_idx = -1
    
    # Find the start of the INSTRUCTIONS section
    for i, line in enumerate(lines):
        if re.match(r"^\s*INSTRUCTIONS\s*$", line, flags=re.IGNORECASE):
            instructions_start_idx = i + 1  # Start from the line after "INSTRUCTIONS"
            break
    
    # If no INSTRUCTIONS section found, return original text
    if instructions_start_idx == -1:
        print("WARNING: No INSTRUCTIONS section found in the LLM response")
        return text.strip()
    
    # Find the end of the INSTRUCTIONS section (next section or end of text)
    for i in range(instructions_start_idx, len(lines)):
        # Look for the next section header (all caps with no lowercase)
        if i > instructions_start_idx and re.match(r"^\s*[A-Z][A-Z\s]+$", lines[i].strip()):
            instructions_end_idx = i - 1
            break
    
    # If no end found, instructions continue to the end of the text
    if instructions_end_idx == -1:
        instructions_end_idx = len(lines) - 1
    
    # Extract the instructions
    instructions = lines[instructions_start_idx:instructions_end_idx + 1]
    
    # Remove empty lines at the beginning and end
    while instructions and not instructions[0].strip():
        instructions.pop(0)
    while instructions and not instructions[-1].strip():
        instructions.pop()
    
    # Count screenshot instructions for logging
    screenshot_count = sum(1 for line in lines if re.search(r"take\s+a\s+screenshot", line, flags=re.IGNORECASE))
    instructions_screenshot_count = sum(1 for line in instructions if re.search(r"take\s+a\s+screenshot", line, flags=re.IGNORECASE))
    
    print(f"Found {screenshot_count} total screenshot instructions in the LLM response")
    print(f"Found {instructions_screenshot_count} screenshot instructions in the INSTRUCTIONS section")
    
    # If no instructions found, return original text
    if not instructions:
        print("WARNING: INSTRUCTIONS section was empty")
        return text.strip()
    
    # Get the plain text instructions
    plain_instructions = "\n".join(instructions).strip()
    
    # Try to parse as JSON
    try:
        # First check if the entire instructions section is valid JSON
        json_instructions = None
        try:
            json_instructions = json.loads(plain_instructions)
            print("Successfully parsed instructions as JSON")
            # If the JSON has an "instructions" field, use that
            if isinstance(json_instructions, dict) and "instructions" in json_instructions:
                print("Found instructions field in JSON")
                return json_instructions["instructions"]
        except json.JSONDecodeError:
            # If not, look for JSON within the instructions
            json_pattern = r'\{[\s\S]*\}'
            json_match = re.search(json_pattern, plain_instructions)
            if json_match:
                try:
                    json_instructions = json.loads(json_match.group(0))
                    print("Found and parsed JSON within instructions")
                    # If the JSON has an "instructions" field, use that
                    if isinstance(json_instructions, dict) and "instructions" in json_instructions:
                        print("Found instructions field in JSON")
                        return json_instructions["instructions"]
                except json.JSONDecodeError:
                    print("Found JSON-like content but failed to parse it")
            else:
                print("No JSON content found in instructions")
        
        # Log both formats
        print("\n--- ORIGINAL INSTRUCTIONS ---")
        print(plain_instructions)
        print("\n--- PARSED JSON (if available) ---")
        if json_instructions:
            print(json.dumps(json_instructions, indent=2))
        else:
            print("No valid JSON found")
            
        # Return the original instructions
        return plain_instructions
    except Exception as e:
        print(f"Error while processing JSON: {e}")
        return plain_instructions

def get_prompt_for_ui_change(doc_content):
    """
    Generates a prompt for replacing a screenshot due to a UI element change.
    Requests response in JSON format.
    """
    return f"""
Goal: Generate a single, comprehensive set of step-by-step browser actions to retake ALL documentation screenshots where UI elements changed (selector, appearance, or structure).

Analyze the entire document to identify ALL screenshots (shown as ![name](./path/to/image)) and create ONE sequential instruction set that captures every single screenshot in the most efficient navigation order.

Output format (strict):
1) THINKING — A brief planning block that:
   - Lists every single screenshot found in the document with exact filenames (![name](./path))
   - Plans the most efficient navigation route to capture all screenshots
   - Notes the expected UI state and purpose for each screenshot
2) INSTRUCTIONS — One numbered sequence starting at 1, covering the entire document. Each step is exactly one browser action.

Before capturing any screenshot:
- Navigate to the correct screen/state
- Ensure UI is fully visible and configured correctly (expand panels, open dropdowns, select tabs, etc.)
- Verify all required elements are visible before taking the screenshot

Rules for INSTRUCTIONS:
- Use imperative voice for each step
- Each step = exactly one action ("click", "type", "open", "hover", "wait until visible", "take a screenshot")
- For every interacted element, include its English name plus brief visual/positional cues (color, icon, "top-right", etc.)
- For screenshot steps, use exact filename from document and include detailed description:
  * WHAT specific UI elements should be visible
  * WHAT the screenshot documents (its purpose)
  * HOW the UI should be configured
  * WHAT the screenshot likely shows (whole page vs partial, main focus area, layout description)
Screenshot step format: "take a screenshot of [specific UI area with detailed location] showing [comprehensive list of visible elements with positions and characteristics], to document [detailed purpose and user benefit]. Save as [filename]"

Example format:
THINKING
Screenshots to capture:
- main-dashboard.png: Overview of primary interface with navigation menu and data panels

Navigation plan: Homepage → Dashboard (capture main-dashboard.png)

INSTRUCTIONS
1. locate the main data table in the center of the screen displaying patient records with columns for names, dates, and status indicators
2. click on the third patient name from the top in the leftmost column to navigate to the dashboard interface
3. wait until the dashboard loads completely with the top navigation bar, left sidebar menu, and main content area visible
4. take a screenshot of the complete dashboard showing the navigation bar with logo and user menu, left sidebar with menu options, and main content area with data widgets and charts, to document the primary user interface and navigation structure. Save as main-dashboard.png


Critical requirements:
- Include every single screenshot found in the document - do not miss any
- Organize navigation efficiently (group screenshots from same screens together)  
- Ensure each screenshot instruction is extremely detailed and specific
- Every screenshot step must include "screenshot" as the action followed by comprehensive description and exact filename
- You start at homepage (Worklist) - no login steps needed
- If choosing among similar items, pick the 3rd in the list
- Ignore pop-out window commands

Navigation notes for this product:
- Standard flow: Worklist → click patient name → wheel interface → select feature
- Make instructions extremely detailed and descriptive with specific visual cues, element positions, colors, icons, and contextual information
- Include precise descriptions of where elements are located (top-left corner, center panel, right sidebar, etc.)
- Describe visual characteristics of elements (button colors, icon shapes, text labels, panel sizes)
- Provide context about what should be visible before and after each action

Document to process:
---
{doc_content}
---

Important: Scan the entire document for all images shown as ![name](./path/to/image) and ensure every single one is included in your instruction sequence. Create one comprehensive set of instructions that captures everything.

Remember: Format your THOUGHT and INSTRUCTIONS as a valid JSON object with the structure shown in the example.
{{
  "thinking": "text string of your thought",
  "instructions": "one text string which has the whole set of detailed instructions (not a list)"
}}
"""

def get_prompt_for_new_feature(doc_content):
    """
    Generates a prompt for filling a screenshot placeholder for a new document or feature.
    Requests response in JSON format.
    """
                      
    import re
    doc_content = re.sub(r'!\[.*?\]\(.*?\)', '', doc_content)
    print("\n\n\n\n\n2")
    print(doc_content)
    print("have used the get_prompt_for_new_feature function")
    return f"""
Goal: Generate step‑by‑step browser actions to fill documentation screenshot placeholders for a new document or feature.

Only produce instructions for explicit placeholders. Your ONLY trigger is the exact HTML comment:
<!-- placeholder for a screenshot -->
If no such placeholders exist in the provided content, generate nothing (NO INSTRUCTIONS ARE NEEDED).

Output format (strict):
1) THINKING — A short planning block with:
   - think of how the instructions should be structured and what the point of each step is.
   - Navigation plan from the Worklist to each target screen related to each placeholder.
   - For each placeholder (and filename if provided), a brief description of the expected UI state and the key elements that must be visible (names, icons, positions) to match the placeholder context.
2) INSTRUCTIONS — Numbered steps starting at 1. Each step is exactly one browser action, grouped in the same order as the placeholders appear in the document. Stop after the last placeholder.

Before any screenshot, ensure the UI is fully visible and in the correct state:
- Expand panels, open dropdowns/overlays, or toggle features as needed to match the description near the placeholder.
- If the required element is already visible, do not click it unnecessarily; proceed to capture.

Rules for INSTRUCTIONS:
- Use imperative voice.
- Each step = exactly one action ("locate", "click", "type", "open", "hover", "wait", "screenshot")
- For every interacted element, include its English name; add brief visual/positional cues when helpful (e.g., color, icon, "top‑right").
- When capturing, use "screenshot" as the action and, if a filename/path is specified next to the placeholder, save using that exact name. Do not invent filenames if none are provided.
- For each screenshot step, include a detailed description that explains:
  * WHAT specific UI elements should be visible in the screenshot
  * WHY this screenshot is important (what it's documenting)
  * HOW the UI should be configured (expanded panels, selected tabs, visible data)
  * WHAT you think the screenshot probably looks like: is it the whole page, or just a part of the page? What is the main focus or area being captured?
- Preserve the order of placeholders in the document. Stop after the last placeholder.

Scope and constraints:
- Include only steps required to reach and capture the placeholder screenshot(s).
- If choosing among similar rows/buttons, pick the 3rd item in the list.
- You are already at the homepage (Worklist). Do not include login steps.
- Ignore any command to open a pop‑out window.
- Add a final step with action "note" and target "quality check" with a description about redoing any screenshots that don't look right.

Example (format only):
THINKING
- Navigation: Worklist → click a patient name → wheel interface → Document Viewer
- Placeholder (document_viewer.png): Expected elements — toolbar at top with "Download" and "Print" icons; left panel with document thumbnails; main viewer canvas centered; patient name at top‑left

INSTRUCTIONS
1. look for the worklist table displayed in the center of the screen showing patient records and click a patient name to open the wheel interface
2. locate the "Document Viewer" button on the wheel interface — it appears as a paper/document icon — and click it
3. wait until the "Document Viewer" page is visible
4. verify the screen matches the expected state with these elements visible: top toolbar with "Download" and "Print" icons; left thumbnail panel; centered document canvas; patient name at top‑left
5. take a screenshot of the document viewer interface showing the toolbar with Download and Print icons at the top, the document thumbnails panel on the left side, and the main document canvas in the center with clear patient information at the top-left, to document the complete document viewing experience for users navigating patient records. Save it with the name "document_viewer.png"
6. add why that step is being performed what is the point of that action and what is the goal state that we are trying to achieve.
7. do not add verify steps u can verify with the screenshot while performing the nxt step anyways just add why the step is being done.
Notes about navigation in this product:
- To reach Document Viewer or Image Viewer from the Worklist, click a patient name to open the wheel interface, then click the corresponding button.
- in document viewer the left panel has documents and patient information as am alternative you need to click on one of them to see them. 
Document to process:
---
{doc_content}
---

Remember: Format your INSTRUCTIONS as a valid JSON object with the structure shown in the example.
"""

def extract_image_paths_from_md(file_content):
    """Extract all image paths from markdown content using regex."""
    import re
    # Match standard markdown image syntax: ![alt text](path/to/image.png)
    image_paths = re.findall(r'!\[.*?\]\((.*?)\)', file_content)
    # Also match HTML img tags: <img src="path/to/image.png" />
    html_image_paths = re.findall(r'<img[^>]*src=[\'"]([^\'"]*)[\'"]', file_content)
    
    # Combine and clean up paths
    all_paths = image_paths + html_image_paths
    # Remove query parameters and anchors
    clean_paths = [p.split('?')[0].split('#')[0] for p in all_paths]
    # Filter out external URLs
    local_paths = [p for p in clean_paths if not p.startswith('http')]
    
    return local_paths

def generate_browser_instructions(scenario_type="default", changed_files=None):
    """Generate browser automation instructions based on the scenario type and changed files."""
    import os
    import re
    from datetime import datetime
    content = ""
    spanish_content = ""
    # For tracking image paths from markdown files
    all_image_paths = []

    print(f"Processing {len(changed_files)} changed files...")
    
    # Separate MD and MDX files for logging
    md_files = [f for f in changed_files if f.endswith('.md')]
    mdx_files = [f for f in changed_files if f.endswith('.mdx')]
    
    print(f"  MD files: {len(md_files)}")
    print(f"  MDX files: {len(mdx_files)}")
    
    # Keep per-file content for contextual hinting
    file_to_content: dict[str, str] = {}

    for file_path in changed_files:
        try:
            file_type = "MDX" if file_path.endswith('.mdx') else "MD"
            with open(file_path, 'r', encoding='utf-8') as file:
                file_content = file.read()
                content += f"\n---\n# {file_path} ({file_type})\n{file_content}"
                file_to_content[file_path] = file_content
                
                # Extract image paths from this markdown file
                file_image_paths = extract_image_paths_from_md(file_content)
                if file_image_paths:
                    print(f"  Found {len(file_image_paths)} image references in {file_path}")
                    all_image_paths.extend(file_image_paths)
        except Exception as e:
            print(f"    Could not read {file_path}: {e}")

    # Initialize LLM here as it's needed for document instruction generation
    llm = AzureChatOpenAI(azure_deployment="gpt-4.1", openai_api_version="2024-02-15-preview")

    # Generate instructions from document content based on scenario
    document_instructions = "Default: No document content was processed or an error occurred during instruction generation."
    if content and content.strip():  # Check if content is not empty or just whitespace
        # Select the appropriate prompt based on scenario type
        print("\n\n\n\n\n\n1")
        
        # Default to UI change mode
        if scenario_type == "default":
            scenario_type = "ui_change"
        
        # Augment content with contextual navigation hints based on the files being processed
        try:
            hints_md = build_playbook_hints_for_changed_files(file_to_content)
            if hints_md:
                content += "\n" + hints_md
        except Exception as _e:
            # Non-fatal: continue without hints if something goes wrong
            logging.warning(f"Failed to build contextual first steps hints: {_e}")

        # Add image paths to the content for the LLM to use
        if all_image_paths:
            content += f"\n\n## Available Image Paths to Capture:\n"
            for i, img_path in enumerate(all_image_paths, 1):
                content += f"{i}. {img_path}\n"
            content += f"\nIMPORTANT: Use these exact image paths when generating screenshot instructions. Do not invent new filenames.\n"
        
        if scenario_type == "ui_change":
            instruction_generation_prompt = get_prompt_for_ui_change(content)
        else:
            instruction_generation_prompt = get_prompt_for_new_feature(content)
        # if scenario_type == "ui_change":
        #     # UI change: replace each image, no Spanish document needed
        #     instruction_generation_prompt = get_prompt_for_new_feature(content)
        # elif scenario_type == "new_feature":
        #     # New feature: find placeholders, only English document needed
        #     instruction_generation_prompt = get_prompt_for_new_feature(content)
#         else:
#             # Fallback: use the existing prompt logic
#             instruction_generation_prompt = f"""
# The goal is to take screenshots of the Spanish version of the website to replace each and every image currently shown from the English website in the documentation.

# You are going to write instructions that help navigate through the Spanish website to reach the exact position needed to take the screenshot.

# The documentation already contains image paths, so that tells you which screenshots you need to take and what each image represents.
# To understand what the image shows, you need to look at both the image filename and the text/content around it.

# Your job is to write all steps needed to reach the screen **and ensure the correct UI elements are fully visible and in the expected state before taking the screenshot.**
# - This includes clicking toggles, expanding dropdowns, or enabling any features that must be turned on to match the reference image.
# - If the reference image shows a dropdown, toggle, overlay, or expanded menu — include the step to interact with it before taking the screenshot.
# - Always assume screenshots should show the fully visible UI state as in the image — not the default or collapsed state.

# These instructions will be used in the browser automation tool Tracewright, so they must be clear, actionable, and step-by-step.

# The only goal is to capture screenshots — so do not include any steps that aren't necessary for that.

# When describing the elements to interact with:

# Include the English name of the element (it helps match HTML tags).
# Include the Spanish name of the element (it helps find the element in the Spanish website using the text locator function).
# Describe the appearance or position of the element if it helps identify it faster.

# ---

# ## Instruction Format Guidelines

# Follow these strict formatting rules for each instruction:

# - Use a number to define each step starts with 1.
# - Every step must indicate a specific browser action.
# - Each instruction must describe **a single, actionable browser operation**.
# - Use **imperative voice** (e.g., "find", "click", "enter").
# - **CRITICAL: For every element you interact with, you MUST include BOTH the English name AND the Spanish name of the element in the instruction.**
# - Be **explicit** about:
#   - **Element identity** (e.g., placeholder text, labels, role, alt text, icons)
#   - **Visual characteristics** (e.g., button color, icons, shapes)
#   - **Placement** (e.g., "center of screen", "top-right corner", "left panel", "wheel interface")
# - If any step involves an image filename (e.g., images/screenshot1.png), include a screenshot instruction and save the image using the same filename.
# - Conserve the order of instruction to match the documentation.
# - Everything you output should be just an instruction and nothing else — no headings or summaries.
# - The goal is to take screenshots; if some action from the documentation is not required for these screenshots, then ignore it.
# - If it's a choice, choose a button that is not too close to others — for example, when selecting a patient record, pick one from the middle of the table.
# - For any screenshot, if the element or feature is only visible after clicking or toggling something, include those steps before the screenshot.
# - You are already at the Spanish website homepage, logged in — continue from the homepage which shows the worklist table. Do **not** include login steps.
# - Always add this "Based on the intructions executed If you think some screenshot taken is not right, redo the process to oget that screenshot" at the end of the instructions.
# - IF there is a command to popout window then ignore it do not add it to the instructions.
# - Take screenshots if there are placeholders for it and name them accordingly.
# - If it is to take a screenshot of a dropdown or some element that is visible You do not have to click on it to make sure just look for those elements then take the screenshot. 

# ---

# ## Example Output Format

# 1.look for the worklist table (tabla de lista de trabajo) displayed in the center of the screen showing patient records and find any patient record row in the worklist table and click on the patient name link to open the wheel interface
# 2.locate the "Document Viewer" (Visor de Documentos) button on the wheel interface — it appears as a paper/document icon — and click on it
# 3.take a screenshot of the document viewer interface and save it with the name "document_viewer.png"

# but the wheel has the document viewer button, image viewer button, study history, billing, etc.
# ---
# ## Document to Process

# Analyze and convert the following content into automation instructions:

# ---
# {content}
# ---
# For reference of what these buttons are named in Spanish, use this Spanish documentation:

# ---
# {spanish_content}
# ---
# Also, you are already at the Spanish website homepage, logged in — continue from the homepage which shows the worklist table.
# ## Generate Automation Instructions for the Spanish website below:
# """

        # Log the exact prompt sent to LLM to a text file
        try:
            with open("llm_prompt_log.txt", "a", encoding="utf-8") as prompt_log_file:
                prompt_log_file.write(
                    f"\n{'='*80}\n"
                    f"TIMESTAMP: {datetime.now().isoformat()}\n"
                    f"SCENARIO: {scenario_type}\n"
                    f"{'='*80}\n"
                )
                prompt_log_file.write(instruction_generation_prompt)
                prompt_log_file.write(f"\n{'='*80}\n\n")
        except Exception as log_error:
            logging.error(f"Failed to log LLM prompt: {log_error}")

        try:
            response = llm.invoke(instruction_generation_prompt)
            
            if hasattr(response, 'content'):
                document_instructions = response.content
            else:
                document_instructions = str(response)  # Fallback if response is not a standard message object
            # Log all image paths that need to be covered
            if all_image_paths:
                print(f"Need screenshots for {len(all_image_paths)} images: {', '.join(all_image_paths)}")
            
            # Post-process to pass only numbered instructions to downstream
            document_instructions = _extract_instructions_only(document_instructions)
            
            # Validate if all images are covered in the instructions
            if all_image_paths:
                covered_images = set()
                for img_path in all_image_paths:
                    # Extract just the filename from the path
                    img_filename = os.path.basename(img_path)
                    if img_filename in document_instructions:
                        covered_images.add(img_filename)
                
                coverage_percentage = (len(covered_images) / len(all_image_paths)) * 100
                print(f"Screenshot coverage: {len(covered_images)}/{len(all_image_paths)} images ({coverage_percentage:.1f}%)")
                
                # Add warning if some images aren't covered
                if len(covered_images) < len(all_image_paths):
                    missing_images = set(os.path.basename(p) for p in all_image_paths) - covered_images
                    warning = f"\n\nWARNING: {len(missing_images)}/{len(all_image_paths)} images are not covered in the instructions: {', '.join(missing_images)}"
                    print(warning)
                    document_instructions += warning
            
            logging.info(f"Successfully generated instructions from document: {document_instructions}")
        except Exception as e:
            logging.error(f"Error generating instructions from document: {e}")
            document_instructions = f"Error: Could not generate instructions from document content due to: {e}"

    # Return just the instructions, trimmed
    task = document_instructions.strip()
    return task

def main():
    """Main function to process command line arguments and generate instructions."""
    parser = argparse.ArgumentParser(description='Generate browser automation instructions')
    parser.add_argument('--changed-files', help='Path to file containing list of changed files, or a single file path')
    args = parser.parse_args()
    
    try:
        changed_files = []
        
        if args.changed_files:
            # Check if it's a single markdown file or a list file
            if args.changed_files.endswith('.md') or args.changed_files.endswith('.mdx'):
                # Single markdown file
                if os.path.exists(args.changed_files):
                    changed_files = [args.changed_files]
                else:
                    pass
            else:
                # List file containing paths
                try:
                    with open(args.changed_files, 'r', encoding='utf-8') as f:
                        file_list = [line.strip() for line in f if line.strip()]
                    
                    # Filter to only docs markdown files (handle both relative and absolute paths)
                    docs_md_files = []
                    docs_mdx_files = []
                    other_files = []
                    
                    for f in file_list:
                        # Handle absolute paths by checking if they contain docs/ and end with .md/.mdx
                        if ('docs/' in f and f.endswith('.md')) or (f.startswith('docs/') and f.endswith('.md')):
                            docs_md_files.append(f)
                        elif ('docs/' in f and f.endswith('.mdx')) or (f.startswith('docs/') and f.endswith('.mdx')):
                            docs_mdx_files.append(f)
                        else:
                            other_files.append(f)
                    
                    # Combine docs files for processing
                    changed_files = docs_md_files + docs_mdx_files
                    
                except Exception as e:
                    pass

        # Default scenario type
        scenario_type = "default"
        import sys
        if len(sys.argv) > 1 and not args.changed_files:
            scenario_type = sys.argv[1]
        
        instructions = generate_browser_instructions(scenario_type, changed_files)
        
        output_file = "generated_instructions.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(instructions)
    except Exception as e:
        import logging
        logging.error(f"Error in main execution: {e}")
        print(f"Failed to generate instructions: {e}")

if __name__ == "__main__":
    main() 