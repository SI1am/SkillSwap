-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
('JavaScript Programming', 'Programming', 'Learn modern JavaScript including ES6+ features'),
('Python Data Science', 'Programming', 'Data analysis and machine learning with Python'),
('Graphic Design', 'Design', 'Create stunning visuals using design principles'),
('Digital Marketing', 'Marketing', 'Social media marketing and SEO strategies'),
('Photography', 'Creative', 'Portrait and landscape photography techniques'),
('Public Speaking', 'Communication', 'Improve presentation and speaking skills'),
('Guitar Playing', 'Music', 'Learn acoustic and electric guitar'),
('Spanish Language', 'Language', 'Conversational Spanish for beginners'),
('Web Development', 'Programming', 'HTML, CSS, and JavaScript for web development'),
('Video Editing', 'Creative', 'Professional video editing techniques'),
('Mathematics Tutoring', 'Academic', 'Calculus and algebra tutoring'),
('Writing Skills', 'Communication', 'Creative and academic writing improvement'),
('Cooking', 'Life Skills', 'Basic cooking and meal preparation'),
('Fitness Training', 'Health', 'Personal fitness and workout planning'),
('3D Modeling', 'Design', 'Blender and 3D design fundamentals')
ON CONFLICT DO NOTHING;

-- Insert sample daily tasks templates
INSERT INTO daily_tasks (user_id, task_type, description, credits_reward, created_at) 
SELECT 
  gen_random_uuid(),
  'login',
  'Log in to the platform',
  5,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM daily_tasks WHERE task_type = 'login');
