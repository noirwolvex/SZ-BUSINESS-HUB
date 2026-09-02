/*
# Create pdf_templates table (single-tenant, no auth)

1. New Tables
- `pdf_templates`
  - `id` (uuid, primary key)
  - `slug` (text, unique, not null) — URL-friendly identifier
  - `name` (text, not null) — display name
  - `description` (text) — short description
  - `category` (text, not null) — e.g. 'invoice', 'contract', 'letter'
  - `page_size` (text, not null, default 'a4') — 'a4', 'letter'
  - `fields` (jsonb, not null) — array of field definitions: { key, label, type: 'text'|'image', x, y, width, height, fontSize, defaultValue, placeholder }
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `pdf_templates`.
- Allow anon + authenticated CRUD — templates are intentionally public/shared (single-tenant app, no sign-in).

3. Seed Data
- Inserts 6 pre-built templates: Invoice, NDA, Cover Letter, Resume, Meeting Notes, Project Proposal.
*/

CREATE TABLE IF NOT EXISTS pdf_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  page_size text NOT NULL DEFAULT 'a4',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_templates" ON pdf_templates;
CREATE POLICY "anon_select_templates" ON pdf_templates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_templates" ON pdf_templates;
CREATE POLICY "anon_insert_templates" ON pdf_templates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_templates" ON pdf_templates;
CREATE POLICY "anon_update_templates" ON pdf_templates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_templates" ON pdf_templates;
CREATE POLICY "anon_delete_templates" ON pdf_templates FOR DELETE
  TO anon, authenticated USING (true);

-- Seed templates
INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'invoice',
  'Invoice Template',
  'A clean, professional invoice with itemized billing fields.',
  'invoice',
  'a4',
  '[{"key":"company_name","label":"Company Name","type":"text","x":56,"y":760,"width":480,"height":30,"fontSize":24,"defaultValue":"Your Company LLC","placeholder":"Company name"},{"key":"invoice_title","label":"Invoice Title","type":"text","x":56,"y":720,"width":200,"height":24,"fontSize":16,"defaultValue":"INVOICE","placeholder":"INVOICE"},{"key":"bill_to","label":"Bill To","type":"text","x":56,"y":660,"width":250,"height":20,"fontSize":11,"defaultValue":"Bill To:","placeholder":"Bill To:"},{"key":"client_name","label":"Client Name","type":"text","x":56,"y":638,"width":250,"height":18,"fontSize":11,"defaultValue":"Client Name","placeholder":"Client name"},{"key":"client_address","label":"Client Address","type":"text","x":56,"y":618,"width":250,"height":18,"fontSize":10,"defaultValue":"Client Address Line","placeholder":"Client address"},{"key":"invoice_date","label":"Invoice Date","type":"text","x":400,"y":660,"width":136,"height":18,"fontSize":11,"defaultValue":"Date: 2026-01-01","placeholder":"Date: YYYY-MM-DD"},{"key":"invoice_number","label":"Invoice Number","type":"text","x":400,"y":638,"width":136,"height":18,"fontSize":11,"defaultValue":"Invoice #: 001","placeholder":"Invoice #:"},{"key":"line_items_header","label":"Items Header","type":"text","x":56,"y":560,"width":480,"height":18,"fontSize":10,"defaultValue":"Description                          Amount","placeholder":"Description     Amount"},{"key":"line_item_1","label":"Line Item 1","type":"text","x":56,"y":538,"width":480,"height":18,"fontSize":10,"defaultValue":"Web Design Services          $1,500.00","placeholder":"Description     Amount"},{"key":"line_item_2","label":"Line Item 2","type":"text","x":56,"y":518,"width":480,"height":18,"fontSize":10,"defaultValue":"Hosting Setup                    $300.00","placeholder":"Description     Amount"},{"key":"line_item_3","label":"Line Item 3","type":"text","x":56,"y":498,"width":480,"height":18,"fontSize":10,"defaultValue":"Domain Registration             $50.00","placeholder":"Description     Amount"},{"key":"total_label","label":"Total Label","type":"text","x":56,"y":450,"width":480,"height":20,"fontSize":12,"defaultValue":"TOTAL: $1,850.00","placeholder":"TOTAL: $0.00"},{"key":"notes","label":"Notes","type":"text","x":56,"y":400,"width":480,"height":18,"fontSize":10,"defaultValue":"Notes: Payment due within 30 days.","placeholder":"Notes:"}]'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'nda',
  'Non-Disclosure Agreement',
  'A standard NDA template with fillable party and date fields.',
  'contract',
  'a4',
  '[{"key":"title","label":"Title","type":"text","x":56,"y":760,"width":480,"height":28,"fontSize":20,"defaultValue":"NON-DISCLOSURE AGREEMENT","placeholder":"Title"},{"key":"intro","label":"Introduction","type":"text","x":56,"y":710,"width":480,"height":60,"fontSize":11,"defaultValue":"This Non-Disclosure Agreement (the Agreement) is entered into on","placeholder":"Intro text"},{"key":"date_field","label":"Date","type":"text","x":56,"y":688,"width":480,"height":18,"fontSize":11,"defaultValue":"January 1, 2026 (the Effective Date)","placeholder":"Date"},{"key":"party_intro","label":"Party Intro","type":"text","x":56,"y":660,"width":480,"height":18,"fontSize":11,"defaultValue":"by and between:","placeholder":"by and between:"},{"key":"party_a","label":"Disclosing Party","type":"text","x":56,"y":638,"width":480,"height":18,"fontSize":11,"defaultValue":"[Disclosing Party Name], located at [Address]","placeholder":"Disclosing party"},{"key":"party_b","label":"Receiving Party","type":"text","x":56,"y":610,"width":480,"height":18,"fontSize":11,"defaultValue":"and [Receiving Party Name], located at [Address]","placeholder":"Receiving party"},{"key":"section_1","label":"Section 1 Title","type":"text","x":56,"y":560,"width":480,"height":18,"fontSize":12,"defaultValue":"1. Definition of Confidential Information","placeholder":"Section title"},{"key":"section_1_body","label":"Section 1 Body","type":"text","x":56,"y":538,"width":480,"height":40,"fontSize":10,"defaultValue":"Confidential Information means any non-public information disclosed by the Disclosing Party.","placeholder":"Section body"},{"key":"section_2","label":"Section 2 Title","type":"text","x":56,"y":480,"width":480,"height":18,"fontSize":12,"defaultValue":"2. Obligations of Receiving Party","placeholder":"Section title"},{"key":"section_2_body","label":"Section 2 Body","type":"text","x":56,"y":458,"width":480,"height":40,"fontSize":10,"defaultValue":"The Receiving Party agrees to hold all Confidential Information in strict confidence.","placeholder":"Section body"},{"key":"signature_a","label":"Signature Disclosing Party","type":"text","x":56,"y":380,"width":200,"height":18,"fontSize":10,"defaultValue":"Disclosing Party: ____________________","placeholder":"Signature line"},{"key":"signature_b","label":"Signature Receiving Party","type":"text","x":300,"y":380,"width":236,"height":18,"fontSize":10,"defaultValue":"Receiving Party: ____________________","placeholder":"Signature line"}]'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'cover-letter',
  'Cover Letter',
  'A professional cover letter template for job applications.',
  'letter',
  'letter',
  '[{"key":"sender_name","label":"Your Name","type":"text","x":56,"y":740,"width":480,"height":22,"fontSize":14,"defaultValue":"Your Name","placeholder":"Your name"},{"key":"sender_address","label":"Your Address","type":"text","x":56,"y":715,"width":480,"height":18,"fontSize":10,"defaultValue":"Your Address, City, State ZIP","placeholder":"Your address"},{"key":"date","label":"Date","type":"text","x":56,"y":680,"width":480,"height":18,"fontSize":10,"defaultValue":"January 1, 2026","placeholder":"Date"},{"key":"employer_name","label":"Employer Name","type":"text","x":56,"y":640,"width":480,"height":18,"fontSize":11,"defaultValue":"Hiring Manager Name","placeholder":"Employer name"},{"key":"employer_company","label":"Company","type":"text","x":56,"y":618,"width":480,"height":18,"fontSize":11,"defaultValue":"Company Name","placeholder":"Company name"},{"key":"employer_address","label":"Company Address","type":"text","x":56,"y":596,"width":480,"height":18,"fontSize":10,"defaultValue":"Company Address, City, State ZIP","placeholder":"Company address"},{"key":"salutation","label":"Salutation","type":"text","x":56,"y":550,"width":480,"height":18,"fontSize":11,"defaultValue":"Dear Hiring Manager,","placeholder":"Dear..."},{"key":"body_1","label":"Body Paragraph 1","type":"text","x":56,"y":520,"width":480,"height":40,"fontSize":11,"defaultValue":"I am writing to express my interest in the position. With my background and skills, I believe I would be a strong candidate.","placeholder":"Opening paragraph"},{"key":"body_2","label":"Body Paragraph 2","type":"text","x":56,"y":460,"width":480,"height":40,"fontSize":11,"defaultValue":"In my previous role, I successfully led multiple projects and delivered results that exceeded expectations.","placeholder":"Body paragraph"},{"key":"closing","label":"Closing","type":"text","x":56,"y":400,"width":480,"height":18,"fontSize":11,"defaultValue":"Thank you for your consideration. I look forward to hearing from you.","placeholder":"Closing"},{"key":"sign_off","label":"Sign Off","type":"text","x":56,"y":360,"width":480,"height":18,"fontSize":11,"defaultValue":"Sincerely, Your Name","placeholder":"Sincerely,"}]'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'resume',
  'Resume Template',
  'A clean one-page resume with sections for experience, education, and skills.',
  'resume',
  'a4',
  '[{"key":"name","label":"Full Name","type":"text","x":56,"y":780,"width":480,"height":28,"fontSize":22,"defaultValue":"Your Name","placeholder":"Full name"},{"key":"title","label":"Job Title","type":"text","x":56,"y":752,"width":480,"height":20,"fontSize":13,"defaultValue":"Software Engineer","placeholder":"Job title"},{"key":"contact","label":"Contact Info","type":"text","x":56,"y":725,"width":480,"height":16,"fontSize":10,"defaultValue":"email@example.com | (555) 123-4567 | City, State","placeholder":"Contact info"},{"key":"summary_header","label":"Summary Header","type":"text","x":56,"y":680,"width":480,"height":18,"fontSize":12,"defaultValue":"SUMMARY","placeholder":"SUMMARY"},{"key":"summary","label":"Summary Text","type":"text","x":56,"y":658,"width":480,"height":40,"fontSize":10,"defaultValue":"Experienced engineer with a track record of building scalable web applications and leading teams.","placeholder":"Summary"},{"key":"experience_header","label":"Experience Header","type":"text","x":56,"y":600,"width":480,"height":18,"fontSize":12,"defaultValue":"EXPERIENCE","placeholder":"EXPERIENCE"},{"key":"exp_1","label":"Experience 1","type":"text","x":56,"y":578,"width":480,"height":18,"fontSize":10,"defaultValue":"Senior Engineer — Company (2023-Present): Led frontend architecture.","placeholder":"Experience"},{"key":"exp_2","label":"Experience 2","type":"text","x":56,"y":556,"width":480,"height":18,"fontSize":10,"defaultValue":"Engineer — Company (2020-2023): Built and shipped multiple products.","placeholder":"Experience"},{"key":"education_header","label":"Education Header","type":"text","x":56,"y":500,"width":480,"height":18,"fontSize":12,"defaultValue":"EDUCATION","placeholder":"EDUCATION"},{"key":"education","label":"Education","type":"text","x":56,"y":478,"width":480,"height":18,"fontSize":10,"defaultValue":"B.S. Computer Science — University (2016-2020)","placeholder":"Education"},{"key":"skills_header","label":"Skills Header","type":"text","x":56,"y":430,"width":480,"height":18,"fontSize":12,"defaultValue":"SKILLS","placeholder":"SKILLS"},{"key":"skills","label":"Skills","type":"text","x":56,"y":408,"width":480,"height":18,"fontSize":10,"defaultValue":"JavaScript, TypeScript, React, Node.js, Python, SQL, Docker","placeholder":"Skills"}]'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'meeting-notes',
  'Meeting Notes',
  'Structured meeting notes with agenda, attendees, and action items.',
  'notes',
  'a4',
  '[{"key":"title","label":"Title","type":"text","x":56,"y":760,"width":480,"height":26,"fontSize":18,"defaultValue":"Meeting Notes","placeholder":"Title"},{"key":"date","label":"Date","type":"text","x":56,"y":728,"width":240,"height":18,"fontSize":11,"defaultValue":"Date: January 1, 2026","placeholder":"Date:"},{"key":"time","label":"Time","type":"text","x":300,"y":728,"width":236,"height":18,"fontSize":11,"defaultValue":"Time: 10:00 AM","placeholder":"Time:"},{"key":"attendees_header","label":"Attendees Header","type":"text","x":56,"y":680,"width":480,"height":18,"fontSize":12,"defaultValue":"ATTENDEES","placeholder":"ATTENDEES"},{"key":"attendees","label":"Attendees List","type":"text","x":56,"y":658,"width":480,"height":20,"fontSize":10,"defaultValue":"John Doe, Jane Smith, Bob Johnson","placeholder":"Attendees"},{"key":"agenda_header","label":"Agenda Header","type":"text","x":56,"y":610,"width":480,"height":18,"fontSize":12,"defaultValue":"AGENDA","placeholder":"AGENDA"},{"key":"agenda_1","label":"Agenda Item 1","type":"text","x":56,"y":588,"width":480,"height":18,"fontSize":10,"defaultValue":"1. Project status update","placeholder":"Agenda item"},{"key":"agenda_2","label":"Agenda Item 2","type":"text","x":56,"y":568,"width":480,"height":18,"fontSize":10,"defaultValue":"2. Budget review","placeholder":"Agenda item"},{"key":"agenda_3","label":"Agenda Item 3","type":"text","x":56,"y":548,"width":480,"height":18,"fontSize":10,"defaultValue":"3. Timeline and next steps","placeholder":"Agenda item"},{"key":"actions_header","label":"Action Items Header","type":"text","x":56,"y":490,"width":480,"height":18,"fontSize":12,"defaultValue":"ACTION ITEMS","placeholder":"ACTION ITEMS"},{"key":"action_1","label":"Action Item 1","type":"text","x":56,"y":468,"width":480,"height":18,"fontSize":10,"defaultValue":"- John: Send budget report by Friday","placeholder":"Action item"},{"key":"action_2","label":"Action Item 2","type":"text","x":56,"y":448,"width":480,"height":18,"fontSize":10,"defaultValue":"- Jane: Schedule follow-up meeting","placeholder":"Action item"}]'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pdf_templates (slug, name, description, category, page_size, fields) VALUES
(
  'project-proposal',
  'Project Proposal',
  'A project proposal with scope, timeline, and budget sections.',
  'proposal',
  'a4',
  '[{"key":"title","label":"Title","type":"text","x":56,"y":760,"width":480,"height":28,"fontSize":20,"defaultValue":"Project Proposal","placeholder":"Title"},{"key":"subtitle","label":"Subtitle","type":"text","x":56,"y":728,"width":480,"height":20,"fontSize":13,"defaultValue":"Mobile App Development","placeholder":"Subtitle"},{"key":"prepared_by","label":"Prepared By","type":"text","x":56,"y":690,"width":480,"height":18,"fontSize":11,"defaultValue":"Prepared by: Your Name","placeholder":"Prepared by:"},{"key":"prepared_for","label":"Prepared For","type":"text","x":56,"y":668,"width":480,"height":18,"fontSize":11,"defaultValue":"Prepared for: Client Name","placeholder":"Prepared for:"},{"key":"date","label":"Date","type":"text","x":56,"y":646,"width":480,"height":18,"fontSize":11,"defaultValue":"Date: January 1, 2026","placeholder":"Date:"},{"key":"scope_header","label":"Scope Header","type":"text","x":56,"y":590,"width":480,"height":18,"fontSize":12,"defaultValue":"PROJECT SCOPE","placeholder":"Scope header"},{"key":"scope_body","label":"Scope Body","type":"text","x":56,"y":568,"width":480,"height":40,"fontSize":10,"defaultValue":"This project involves designing and developing a cross-platform mobile application with user authentication, payment integration, and an admin dashboard.","placeholder":"Scope body"},{"key":"timeline_header","label":"Timeline Header","type":"text","x":56,"y":500,"width":480,"height":18,"fontSize":12,"defaultValue":"TIMELINE","placeholder":"Timeline header"},{"key":"timeline","label":"Timeline","type":"text","x":56,"y":478,"width":480,"height":20,"fontSize":10,"defaultValue":"Phase 1: Design (2 weeks) | Phase 2: Development (8 weeks) | Phase 3: Testing (2 weeks)","placeholder":"Timeline"},{"key":"budget_header","label":"Budget Header","type":"text","x":56,"y":430,"width":480,"height":18,"fontSize":12,"defaultValue":"BUDGET","placeholder":"Budget header"},{"key":"budget","label":"Budget","type":"text","x":56,"y":408,"width":480,"height":20,"fontSize":10,"defaultValue":"Design: $5,000 | Development: $20,000 | Testing: $3,000 | Total: $28,000","placeholder":"Budget"}]'
) ON CONFLICT (slug) DO NOTHING;
