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

def get_prompt_for_ui_change(doc_content):
    """
    Generates a prompt for replacing a screenshot due to a UI element change.
    """
    return f"""
The goal is to take a new screenshots of the website to replace the outdated image because the UI element has changed (selector, appearance, or structure).

You are to write instructions that help navigate through the website to reach the exact position needed to take the new screenshot.

The documentation already contains image paths, so that tells you which screenshot you need to take and what each image represents. To understand what the image shows, look at both the image filename and the text/content around it.

Your job is to write all steps needed to reach the screen **and ensure the correct UI elements are fully visible and in the expected state before taking the screenshot.**
- This includes clicking toggles, expanding dropdowns, or enabling any features that must be turned on to match the reference image.
- If the reference image shows a dropdown, toggle, overlay, or expanded menu — include the step to interact with it before taking the screenshot.
- Always assume screenshots should show the fully visible UI state as in the image — not the default or collapsed state.

These instructions will be used in the browser automation tool Tracewright, so they must be clear, actionable, and step-by-step.

The only goal is to capture screenshots — so do not include any steps that aren't necessary for that.

When describing the elements to interact with:
- Include the English name of the element (it helps match HTML tags).
- Describe the appearance or position of the element if it helps identify it faster.

---

## Instruction Format Guidelines

- Use a number to define each step starts with 1.
- Every step must indicate a specific browser action.
- Each instruction must describe **a single, actionable browser operation**.
- Use **imperative voice** (e.g., "find", "click", "enter").
- **CRITICAL: For every element you interact with, you MUST include the name of the element in the instruction.**
- Be **explicit** about:
  - **Element identity** (e.g., placeholder text, labels, role, alt text, icons)
  - **Visual characteristics** (e.g., button color, icons, shapes)
  - **Placement** (e.g., "center of screen", "top-right corner", "left panel", "wheel interface")
- If any step involves an image filename (e.g., images/screenshot1.png), include a screenshot instruction and save the image using the same filename.
- Conserve the order of instruction to match the documentation.
- Everything you output should be just an instruction and nothing else — no headings or summaries.
- The goal is to take screenshots; if some action from the documentation is not required for these screenshots, then ignore it.
- If it's a choice, choose a button that is not too close to others — for example, when selecting a patient record, pick one from the middle of the table.
- For any screenshot, if the element or feature is only visible after clicking or toggling something, include those steps before the screenshot.
- You are already at the website homepage, logged in — continue from the homepage which shows the worklist table. Do **not** include login steps.
- Always add this "Based on the instructions executed If you think some screenshot taken is not right, redo the process to get that screenshot" at the end of the instructions.
- IF there is a command to popout window then ignore it do not add it to the instructions.
- Take screenshots if there are placeholders for it and name them accordingly.
- If it is to take a screenshot of a dropdown or some element that is visible You do not have to click on it to make sure just look for those elements then take the screenshot. 
---
Example output:
1.look for the worklist table displayed in the center of the screen showing patient records and find any patient record row in the worklist table and click on the patient name link to open the wheel interface
2.locate the "Document Viewer" button on the wheel interface — it appears as a paper/document icon — and click on it
3.take a screenshot of the document viewer interface and save it with the name "document_viewer.png"

but the wheel has the document viewer button, image viewer button, study history, billing, etc.
---
## Document to Process

Analyze and convert the following content into automation instructions:
First to get to the page from where you follow the document You need to know that from home page to get to Document Viewer or Image Viewer you need to click on the "Document Viewer" or "Image Viewer" button on the wheel interface.
Wheel interface pops up when you click on one of the worklist records just find a name in the worklist table and click on it to open the wheel interface.

---
{doc_content}
---
"""

def get_prompt_for_new_feature( doc_content):
    """
    Generates a prompt for filling a screenshot placeholder for a new document or feature.
    """
    return f"""
A new document section or feature has been added, and there is a placeholder for a screenshot that needs to be filled with .

You are to write instructions that help navigate through the website to reach the exact position needed to take the new screenshot for this feature or document section.

The documentation already contains image paths, so that tells you which screenshot you need to take and what each image represents. To understand what the image shows, look at both the image filename and the text/content around it.

Your job is to write all steps needed to reach the screen **and ensure the correct UI elements are fully visible and in the expected state before taking the screenshot.**
- This includes clicking toggles, expanding dropdowns, or enabling any features that must be turned on to match the reference image.
- If the reference image shows a dropdown, toggle, overlay, or expanded menu — include the step to interact with it before taking the screenshot.
- Always assume screenshots should show the fully visible UI state as in the image — not the default or collapsed state.

These instructions will be used in the browser automation tool Tracewright, so they must be clear, actionable, and step-by-step.

The only goal is to capture screenshots — so do not include any steps that aren't necessary for that.

When describing the elements to interact with:
- Include the English name of the element (it helps match HTML tags).
- Describe the appearance or position of the element if it helps identify it faster.

---

## Instruction Format Guidelines

- Use a number to define each step starts with 1.
- Every step must indicate a specific browser action.
- Each instruction must describe **a single, actionable browser operation**.
- Use **imperative voice** (e.g., "find", "click", "enter").
- **CRITICAL: For every element you interact with, you MUST include BOTH the English name of the element in the instruction.**
- Be **explicit** about:
  - **Element identity** (e.g., placeholder text, labels, role, alt text, icons)
  - **Visual characteristics** (e.g., button color, icons, shapes)
  - **Placement** (e.g., "center of screen", "top-right corner", "left panel", "wheel interface")
- If any step involves an image filename (e.g., images/screenshot1.png), include a screenshot instruction and save the image using the same filename.
- Conserve the order of instruction to match the documentation.
- Everything you output should be just an instruction and nothing else — no headings or summaries.
- The goal is to take screenshots; if some action from the documentation is not required for these screenshots, then ignore it.
- If it's a choice, choose a button that is not too close to others — for example, when selecting a patient record, pick one from the middle of the table.
- For any screenshot, if the element or feature is only visible after clicking or toggling something, include those steps before the screenshot.
- You are already at the website homepage, logged in — continue from the homepage which shows the worklist table. Do **not** include login steps.
- Always add this "Based on the instructions executed If you think some screenshot taken is not right, redo the process to get that screenshot" at the end of the instructions.
- IF there is a command to popout window then ignore it do not add it to the instructions.
- Take screenshots if there are placeholders for it and name them accordingly.
- If it is to take a screenshot of a dropdown or some element that is visible You do not have to click on it to make sure just look for those elements then take the screenshot. 

---
Example output:
1.look for the worklist table displayed in the center of the screen showing patient records and find any patient record row in the worklist table and click on the patient name link to open the wheel interface
2.locate the "Document Viewer" button on the wheel interface — it appears as a paper/document icon — and click on it
3.take a screenshot of the document viewer interface and save it with the name "document_viewer.png"

but the wheel has the document viewer button, image viewer button, study history, billing, etc.
---
## Document to Process

Analyze and convert the following content into automation instructions:
First to get to the page from where you follow the document You need to know that from home page to get to Document Viewer or Image Viewer you need to click on the "Document Viewer" or "Image Viewer" button on the wheel interface.
Wheel interface pops up when you click on one of the worklist records just find a name in the worklist table and click on it to open the wheel interface.

---
{doc_content}
---
"""

def generate_browser_instructions(scenario_type="default", changed_files=None):
    """Generate browser automation instructions based on the scenario type and changed files."""
    img_filename = "screenshot.png"  # Placeholder, replace with actual logic if needed
    import os
    from datetime import datetime
    content = ""
    spanish_content = ""

    print(f"Processing {len(changed_files)} changed files...")
    
    # Separate MD and MDX files for logging
    md_files = [f for f in changed_files if f.endswith('.md')]
    mdx_files = [f for f in changed_files if f.endswith('.mdx')]
    
    print(f"  MD files: {len(md_files)}")
    print(f"  MDX files: {len(mdx_files)}")
    
    for file_path in changed_files:
        try:
            file_type = "MDX" if file_path.endswith('.mdx') else "MD"
            print(f"  Reading {file_type}: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                file_content = file.read()
                content += f"\n---\n# {file_path} ({file_type})\n{file_content}"
                print(f"    Successfully read {len(file_content)} characters")
        except Exception as e:
            print(f"    Could not read {file_path}: {e}")

    # Initialize LLM here as it's needed for document instruction generation
    llm = AzureChatOpenAI(azure_deployment="gpt-4.1", openai_api_version="2024-02-15-preview")

    # Generate instructions from document content based on scenario
    document_instructions = "Default: No document content was processed or an error occurred during instruction generation."
    
    if content and content.strip():  # Check if content is not empty or just whitespace
        # Select the appropriate prompt based on scenario type
        if scenario_type == "ui_change":
            # UI change: replace each image, no Spanish document needed
            instruction_generation_prompt = get_prompt_for_ui_change(content)
        elif scenario_type == "new_feature":
            # New feature: find placeholders, only English document needed
            instruction_generation_prompt = get_prompt_for_new_feature(content)
        else:
            # Fallback: use the existing prompt logic
            instruction_generation_prompt = f"""
The goal is to take screenshots of the Spanish version of the website to replace each and every image currently shown from the English website in the documentation.

You are going to write instructions that help navigate through the Spanish website to reach the exact position needed to take the screenshot.

The documentation already contains image paths, so that tells you which screenshots you need to take and what each image represents.
To understand what the image shows, you need to look at both the image filename and the text/content around it.

Your job is to write all steps needed to reach the screen **and ensure the correct UI elements are fully visible and in the expected state before taking the screenshot.**
- This includes clicking toggles, expanding dropdowns, or enabling any features that must be turned on to match the reference image.
- If the reference image shows a dropdown, toggle, overlay, or expanded menu — include the step to interact with it before taking the screenshot.
- Always assume screenshots should show the fully visible UI state as in the image — not the default or collapsed state.

These instructions will be used in the browser automation tool Tracewright, so they must be clear, actionable, and step-by-step.

The only goal is to capture screenshots — so do not include any steps that aren't necessary for that.

When describing the elements to interact with:

Include the English name of the element (it helps match HTML tags).
Include the Spanish name of the element (it helps find the element in the Spanish website using the text locator function).
Describe the appearance or position of the element if it helps identify it faster.

---

## Instruction Format Guidelines

Follow these strict formatting rules for each instruction:

- Use a number to define each step starts with 1.
- Every step must indicate a specific browser action.
- Each instruction must describe **a single, actionable browser operation**.
- Use **imperative voice** (e.g., "find", "click", "enter").
- **CRITICAL: For every element you interact with, you MUST include BOTH the English name AND the Spanish name of the element in the instruction.**
- Be **explicit** about:
  - **Element identity** (e.g., placeholder text, labels, role, alt text, icons)
  - **Visual characteristics** (e.g., button color, icons, shapes)
  - **Placement** (e.g., "center of screen", "top-right corner", "left panel", "wheel interface")
- If any step involves an image filename (e.g., images/screenshot1.png), include a screenshot instruction and save the image using the same filename.
- Conserve the order of instruction to match the documentation.
- Everything you output should be just an instruction and nothing else — no headings or summaries.
- The goal is to take screenshots; if some action from the documentation is not required for these screenshots, then ignore it.
- If it's a choice, choose a button that is not too close to others — for example, when selecting a patient record, pick one from the middle of the table.
- For any screenshot, if the element or feature is only visible after clicking or toggling something, include those steps before the screenshot.
- You are already at the Spanish website homepage, logged in — continue from the homepage which shows the worklist table. Do **not** include login steps.
- Always add this "Based on the intructions executed If you think some screenshot taken is not right, redo the process to oget that screenshot" at the end of the instructions.
- IF there is a command to popout window then ignore it do not add it to the instructions.
- Take screenshots if there are placeholders for it and name them accordingly.
- If it is to take a screenshot of a dropdown or some element that is visible You do not have to click on it to make sure just look for those elements then take the screenshot. 

---

## Example Output Format

1.look for the worklist table (tabla de lista de trabajo) displayed in the center of the screen showing patient records and find any patient record row in the worklist table and click on the patient name link to open the wheel interface
2.locate the "Document Viewer" (Visor de Documentos) button on the wheel interface — it appears as a paper/document icon — and click on it
3.take a screenshot of the document viewer interface and save it with the name "document_viewer.png"

but the wheel has the document viewer button, image viewer button, study history, billing, etc.
---
## Document to Process

Analyze and convert the following content into automation instructions:

---
{content}
---
For reference of what these buttons are named in Spanish, use this Spanish documentation:

---
{spanish_content}
---
Also, you are already at the Spanish website homepage, logged in — continue from the homepage which shows the worklist table.
## Generate Automation Instructions for the Spanish website below:
"""

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
            logging.info(f"Successfully generated instructions from document: {document_instructions}")
        except Exception as e:
            logging.error(f"Error generating instructions from document: {e}")
            document_instructions = f"Error: Could not generate instructions from document content due to: {e}"

    task = f"""
    {document_instructions}
    """
    return task

def main():
    """Main function to execute the instruction generation process."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--changed-files', type=str, help='Path to file containing list of changed files')
    args = parser.parse_args()
    changed_files = []
    
    if args.changed_files:
        print(f"=== PROCESSING CHANGED FILES ===")
        print(f"Input argument: {args.changed_files}")
        print(f"Argument type: {'Single file' if (args.changed_files.endswith('.md') or args.changed_files.endswith('.mdx')) else 'List file'}")
        
        # Check if the argument is a single .md or .mdx file
        if args.changed_files.endswith('.md') or args.changed_files.endswith('.mdx'):
            print(f"Detected single markdown file: {args.changed_files}")
            if os.path.exists(args.changed_files):
                changed_files = [args.changed_files]
                print(f"✅ Single file found and added to processing list")
                print(f"File path: {args.changed_files}")
                print(f"File exists: True")
            else:
                print(f"❌ Single file not found: {args.changed_files}")
                print(f"Current working directory: {os.getcwd()}")
                changed_files = []
        else:
            print(f"Detected list file, reading contents...")
            # Treat as a file containing a list of files
            try:
                with open(args.changed_files, 'r') as f:
                    changed_files = [line.strip() for line in f if line.strip()]
                print(f"✅ Successfully read list file")
                print(f"Found {len(changed_files)} total entries in list file")
                
                # Categorize files
                docs_md_files = [f for f in changed_files if f.endswith('.md') and ('docs/' in f)]
                docs_mdx_files = [f for f in changed_files if f.endswith('.mdx') and ('docs/' in f)]
                other_files = [f for f in changed_files if not (f.endswith('.md') or f.endswith('.mdx')) or not ('docs/' in f)]
                
                print(f"=== FILE CATEGORIZATION ===")
                print(f"Docs MD files ({len(docs_md_files)}):")
                for file_path in docs_md_files:
                    print(f"    - {file_path}")
                
                print(f"Docs MDX files ({len(docs_mdx_files)}):")
                for file_path in docs_mdx_files:
                    print(f"    - {file_path}")
                
                print(f"Other files ({len(other_files)}):")
                for file_path in other_files:
                    print(f"    - {file_path}")
                
                # Use only docs markdown files for processing
                changed_files = docs_md_files + docs_mdx_files
                print(f"=== FINAL PROCESSING LIST ===")
                print(f"Total docs files to process: {len(changed_files)} (MD + MDX)")
                
            except Exception as e:
                print(f"❌ Error reading list file: {e}")
                print(f"File path: {args.changed_files}")
                print(f"Current working directory: {os.getcwd()}")
                changed_files = []
    
    try:
        scenario_type = "default"
        import sys
        if len(sys.argv) > 1 and not args.changed_files:
            scenario_type = sys.argv[1]
        
        print(f"=== CALLING INSTRUCTION GENERATION ===")
        print(f"Scenario type: {scenario_type}")
        print(f"Changed files to pass to function: {len(changed_files)} files")
        for i, file_path in enumerate(changed_files):
            print(f"  {i+1}. {file_path}")
        
        print(f"Calling generate_browser_instructions with:")
        print(f"  - scenario_type: {scenario_type}")
        print(f"  - changed_files: {changed_files}")
        
        instructions = generate_browser_instructions(scenario_type, changed_files)
        
        print(f"=== INSTRUCTION GENERATION COMPLETE ===")
        print(f"Instructions length: {len(instructions)} characters")
        print(f"Instructions preview (first 200 chars): {instructions[:200]}...")
        
        output_file = "generated_instructions.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(instructions)
        print(f"\nInstructions saved to: {output_file}")
    except Exception as e:
        import logging
        logging.error(f"Error in main execution: {e}")
        print(f"Failed to generate instructions: {e}")

if __name__ == "__main__":
    main() 