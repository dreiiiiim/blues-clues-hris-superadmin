 -- blues-clues-hris-superadmin/sql/seeds/defaults.sql
  -- Usage: psql "$SUPABASE_DB_URL" -v company_id=<uuid> -f sql/seeds/defaults.sql

  -- Default departments
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

  -- Default roles (System Admin already seeded by provision step)
  INSERT INTO role (role_id, role_name, company_id)
  SELECT gen_random_uuid()::varchar, r.name, :'company_id'
  FROM (VALUES
    ('Admin'),
    ('HR Officer'),
    ('HR Recruiter'),
    ('HR Interviewer'),
    ('Manager'),
    ('Employee'),
    ('HR Onboarding Officer'),
    ('HR Compensation and Benefits Officer'),
    ('HR Performance Management Officer'),
    ('HR Offboarding Officer/Coordinator')
  ) AS r(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM role
    WHERE company_id = :'company_id' AND role_name = r.name
  );

  -- Role portal mappings
  INSERT INTO role_portal_map (role_id, portal_key)
  SELECT r.role_id, m.portal_key
  FROM role r
  JOIN (VALUES
    ('Admin',                                       'admin'),
    ('HR Officer',                                  'hr'),
    ('HR Recruiter',                                'hr'),
    ('HR Interviewer',                              'hr'),
    ('Manager',                                     'manager'),
    ('Employee',                                    'employee'),
    ('HR Onboarding Officer',                       'hr'),
    ('HR Compensation and Benefits Officer',        'hr'),
    ('HR Performance Management Officer',           'hr'),
    ('HR Offboarding Officer/Coordinator',          'hr')
  ) AS m(role_name, portal_key) ON m.role_name = r.role_name
  WHERE r.company_id = :'company_id'
  ON CONFLICT (role_id, portal_key) DO NOTHING;