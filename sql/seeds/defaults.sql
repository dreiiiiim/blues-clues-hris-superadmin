-- blues-clues-hris-superadmin/sql/seeds/defaults.sql
-- Seeded by GHA after schema creation.
-- Usage: psql "$SUPABASE_DB_URL" -v company_id=<uuid> -f sql/seeds/defaults.sql

-- Default departments (skip if already exist for this company)
INSERT INTO department (department_name, company_id)
SELECT d.name, :'company_id'
FROM (VALUES
  ('General'),
  ('IT'),
  ('HR'),
  ('Finance'),
  ('Operations')
) AS d(name)
WHERE NOT EXISTS (
  SELECT 1 FROM department WHERE company_id = :'company_id'
);

-- Default roles (HR Manager, Employee, Recruiter — System Admin already seeded by Phase 1)
INSERT INTO role (role_name, company_id)
SELECT r.name, :'company_id'
FROM (VALUES
  ('HR Manager'),
  ('Employee'),
  ('Recruiter')
) AS r(name)
WHERE NOT EXISTS (
  SELECT 1 FROM role
  WHERE company_id = :'company_id' AND role_name = r.name
);
