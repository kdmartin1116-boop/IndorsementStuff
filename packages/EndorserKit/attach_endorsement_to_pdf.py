import json
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from io import BytesIO

def attach_endorsement_to_pdf_function(original_pdf_path, endorsement_data, output_pdf_path, ink_color, page_index):
    print(f"🔧 Creating endorsement overlay...")
    
    # Create overlay PDF with endorsement text
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Get page dimensions
    page_width, page_height = letter  # 612, 792 points
    
    # Set ink color
    if ink_color == "blue":
        text_color = (0, 0, 1)
    elif ink_color == "red":
        text_color = (1, 0, 0)
    else:
        text_color = (0, 0, 0)  # black
    
    # Create a highly visible background box for the endorsement
    # Using exact coordinates from interactive positioner
    box_x = 579  # Precise position from drag-and-drop tool
    box_y = 339  # Exact Y coordinate for perfect placement
    box_width = 140
    box_height = 70
    
    # Draw bright yellow background with thick border
    can.setFillColorRGB(1, 1, 0)  # Bright yellow
    can.setStrokeColorRGB(1, 0, 0)  # Red border
    can.setLineWidth(4)
    can.rect(box_x, box_y, box_width, box_height, fill=1, stroke=1)
    
    # Set text color to black for maximum visibility on yellow background
    can.setFillColorRGB(0, 0, 0)  # Black text
    
    # Draw text horizontally (same direction as page text)
    can.setFont("Helvetica-Bold", 8)
    can.drawString(box_x + 3, box_y + box_height - 12, "UCC ART. 3 ENDORSEMENT")
    
    can.setFont("Helvetica-Bold", 7)
    can.drawString(box_x + 3, box_y + box_height - 26, "ACCEPTED FOR VALUE")
    can.drawString(box_x + 3, box_y + box_height - 38, "EXEMPT FROM LEVY")
    can.drawString(box_x + 3, box_y + box_height - 50, "DISCHARGED")

    can.setFont("Helvetica", 6)
    can.drawString(box_x + 3, box_y + box_height - 62, "BY: CREDITOR")
    can.drawString(box_x + 3, box_y + box_height - 74, "W/O RECOURSE")
    
    can.save()
    packet.seek(0)
    print(f"✅ Overlay PDF created")

    try:
        # Load original PDF
        print(f"📖 Reading original PDF: {original_pdf_path}")
        reader = PdfReader(original_pdf_path)
        writer = PdfWriter()
        overlay = PdfReader(packet)

        print(f"📄 Original PDF has {len(reader.pages)} pages")
        print(f"🎨 Overlay PDF has {len(overlay.pages)} pages")

        # Merge overlay onto specified page
        if page_index < len(reader.pages):
            page = reader.pages[page_index]
            overlay_page = overlay.pages[0]
            
            print(f"🔀 Merging overlay onto page {page_index}")
            page.merge_page(overlay_page)
            writer.add_page(page)

            # Add remaining pages
            for i, p in enumerate(reader.pages):
                if i != page_index:
                    writer.add_page(p)

            # Save new PDF
            print(f"💾 Saving endorsed PDF to: {output_pdf_path}")
            with open(output_pdf_path, "wb") as f:
                writer.write(f)
            
            print(f"✅ Endorsement successfully attached!")
            
        else:
            print(f"❌ Page index {page_index} is out of range for PDF with {len(reader.pages)} pages")
            raise Exception(f"Page index {page_index} is out of range")
            
    except Exception as e:
        print(f"❌ Error attaching endorsement: {str(e)}")
        raise

    print(f"📎 Endorsement chain attached to {output_pdf_path}")
