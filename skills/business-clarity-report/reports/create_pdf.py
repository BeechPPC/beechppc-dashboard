#!/usr/bin/env python3
"""
Convert Grays.com business clarity markdown report to PDF.
Uses reportlab to generate a professionally formatted PDF document.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import re
import os

def parse_markdown_line(line, styles):
    """Parse a markdown line and return appropriate reportlab elements."""
    elements = []

    # Skip empty lines
    if not line.strip():
        elements.append(Spacer(1, 0.1*inch))
        return elements

    # Headers
    if line.startswith('# '):
        text = line[2:].strip()
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(text, styles['Heading1']))
        elements.append(Spacer(1, 0.1*inch))
    elif line.startswith('## '):
        text = line[3:].strip()
        elements.append(Spacer(1, 0.15*inch))
        elements.append(Paragraph(text, styles['Heading2']))
        elements.append(Spacer(1, 0.05*inch))
    elif line.startswith('### '):
        text = line[4:].strip()
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(text, styles['Heading3']))
    # Bold metadata lines (Date, Website, Industry)
    elif line.startswith('**') and line.endswith('**'):
        text = line.strip('*')
        elements.append(Paragraph(f'<b>{text}</b>', styles['Normal']))
    # Horizontal rules
    elif line.strip() == '---':
        elements.append(Spacer(1, 0.1*inch))
    # Numbered lists
    elif re.match(r'^\d+\.\s', line):
        text = line.strip()
        # Convert markdown bold to HTML bold
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        elements.append(Paragraph(text, styles['Bullet']))
    # Bullet lists
    elif line.strip().startswith('- '):
        text = line.strip()[2:]
        # Convert markdown bold to HTML bold
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        elements.append(Paragraph(f'• {text}', styles['Bullet']))
    # Regular paragraphs
    else:
        text = line.strip()
        # Convert markdown bold to HTML bold
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        elements.append(Paragraph(text, styles['Normal']))

    return elements

def parse_table(lines, start_idx, styles):
    """Parse a markdown table and return reportlab Table element."""
    table_lines = []
    idx = start_idx

    # Collect all table lines
    while idx < len(lines) and '|' in lines[idx]:
        table_lines.append(lines[idx])
        idx += 1

    if len(table_lines) < 2:
        return None, start_idx

    # Parse table data
    data = []
    for i, line in enumerate(table_lines):
        # Skip separator line
        if i == 1 and '---' in line:
            continue

        cells = [cell.strip() for cell in line.split('|')]
        # Remove empty first and last cells from splitting
        if cells and not cells[0]:
            cells = cells[1:]
        if cells and not cells[-1]:
            cells = cells[:-1]

        if cells:
            data.append(cells)

    if not data:
        return None, start_idx

    # Create table with styling - Beech PPC brand colors
    table = Table(data, colWidths=[2*inch, 0.8*inch, 3.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111827')),  # gray-900 for headers
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),  # White background for data rows
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),  # gray-200 for borders
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),  # Alternate white and gray-50
    ]))

    return table, idx

def create_pdf(markdown_file, pdf_file):
    """Convert markdown file to PDF."""

    # Read markdown content
    with open(markdown_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Create PDF document
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Container for PDF elements
    story = []

    # Add Beech PPC logo in top right corner
    logo_path = '/Users/chrisbeechey/BeechPPCBrain/images/BeechPPClogo.png'
    if os.path.exists(logo_path):
        # Create a table to position logo in top right
        logo_img = Image(logo_path, width=1.5*inch, height=1.5*inch, kind='proportional')
        logo_table = Table([[logo_img]], colWidths=[6.5*inch])
        logo_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(logo_table)
        story.append(Spacer(1, 0.2*inch))

    # Create custom styles
    styles = getSampleStyleSheet()

    # Title style - Beech PPC brand colors
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#111827'),  # gray-900 for headings
        spaceAfter=30,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    styles.add(title_style)

    # Heading styles - Beech PPC brand colors
    styles['Heading1'].fontSize = 16
    styles['Heading1'].textColor = colors.HexColor('#111827')  # gray-900 for headings
    styles['Heading1'].fontName = 'Helvetica-Bold'

    styles['Heading2'].fontSize = 14
    styles['Heading2'].textColor = colors.HexColor('#111827')  # gray-900 for headings
    styles['Heading2'].fontName = 'Helvetica-Bold'

    styles['Heading3'].fontSize = 12
    styles['Heading3'].textColor = colors.HexColor('#111827')  # gray-900 for headings
    styles['Heading3'].fontName = 'Helvetica-Bold'

    # Body text style - Beech PPC brand colors
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    styles['Normal'].alignment = TA_JUSTIFY
    styles['Normal'].textColor = colors.HexColor('#374151')  # gray-700 for body text

    # Modify existing Bullet style
    styles['Bullet'].leftIndent = 20
    styles['Bullet'].spaceAfter = 6

    # Parse markdown and build PDF
    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for tables
        if '|' in line and i + 1 < len(lines) and '---' in lines[i + 1]:
            table, new_idx = parse_table(lines, i, styles)
            if table:
                story.append(Spacer(1, 0.1*inch))
                story.append(table)
                story.append(Spacer(1, 0.2*inch))
                i = new_idx
                continue

        # Parse regular markdown lines
        elements = parse_markdown_line(line, styles)
        story.extend(elements)
        i += 1

    # Build PDF
    doc.build(story)
    print(f"PDF created successfully: {pdf_file}")

if __name__ == "__main__":
    markdown_file = "/Users/chrisbeechey/BeechPPCBrain/.claude/skills/business-clarity-report/reports/grays-com-report.md"
    pdf_file = "/Users/chrisbeechey/BeechPPCBrain/.claude/skills/business-clarity-report/reports/grays-com-report.pdf"

    create_pdf(markdown_file, pdf_file)
