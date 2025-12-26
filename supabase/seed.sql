-- ============================================================================
-- Seed Data - Course Learning Platform
-- Based on Udemy 2024/2025 Statistics:
-- - 260,000+ courses, 77M+ users
-- - Technology & Business = 74.6% of enrollments
-- - Python: 36M+ learners (most popular)
-- - Web Development: 11M+ students
-- ============================================================================

-- ============================================================================
-- CATEGORIES (Based on Udemy's Top Categories)
-- Development and IT & Software are the largest categories
-- ============================================================================

INSERT INTO categories (slug, name, description, icon, color, sort_order, is_featured) VALUES
('development', 'Development', 'Programming, web development, mobile apps, game development, and more', 'Code2', '#7C3AED', 1, TRUE),
('it-software', 'IT & Software', 'IT certifications, cybersecurity, network administration, and DevOps', 'Shield', '#2563EB', 2, TRUE),
('data-science', 'Data Science', 'Data analysis, machine learning, artificial intelligence, and statistics', 'Brain', '#0891B2', 3, TRUE),
('business', 'Business', 'Entrepreneurship, management, sales, and business strategy', 'Briefcase', '#059669', 4, FALSE),
('design', 'Design', 'Web design, graphic design, UX/UI, and design tools', 'Palette', '#DC2626', 5, FALSE),
('personal-development', 'Personal Development', 'Productivity, leadership, career development, and soft skills', 'Target', '#D97706', 6, FALSE);

-- ============================================================================
-- SUBCATEGORIES
-- ============================================================================

-- Development Subcategories
INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'web-development', 'Web Development', 'Frontend, backend, and full-stack web development', 1
FROM categories c WHERE c.slug = 'development';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'mobile-development', 'Mobile Development', 'iOS, Android, and cross-platform mobile app development', 2
FROM categories c WHERE c.slug = 'development';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'programming-languages', 'Programming Languages', 'Python, JavaScript, Java, C++, and more', 3
FROM categories c WHERE c.slug = 'development';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'game-development', 'Game Development', 'Unity, Unreal Engine, and game programming', 4
FROM categories c WHERE c.slug = 'development';

-- IT & Software Subcategories
INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'cloud-computing', 'Cloud Computing', 'AWS, Azure, Google Cloud, and cloud architecture', 1
FROM categories c WHERE c.slug = 'it-software';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'cybersecurity', 'Cybersecurity', 'Ethical hacking, security certifications, and network security', 2
FROM categories c WHERE c.slug = 'it-software';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'devops', 'DevOps', 'Docker, Kubernetes, CI/CD, and infrastructure automation', 3
FROM categories c WHERE c.slug = 'it-software';

-- Data Science Subcategories
INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'machine-learning', 'Machine Learning', 'ML algorithms, deep learning, and neural networks', 1
FROM categories c WHERE c.slug = 'data-science';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'data-analysis', 'Data Analysis', 'SQL, Excel, Tableau, and data visualization', 2
FROM categories c WHERE c.slug = 'data-science';

INSERT INTO subcategories (category_id, slug, name, description, sort_order)
SELECT c.id, 'artificial-intelligence', 'Artificial Intelligence', 'AI fundamentals, NLP, computer vision, and AI applications', 3
FROM categories c WHERE c.slug = 'data-science';

-- ============================================================================
-- TOPICS
-- ============================================================================

-- Web Development Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'javascript', 'JavaScript', 'The programming language of the web', 1, TRUE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'react', 'React', 'Popular JavaScript library for building user interfaces', 2, TRUE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'nodejs', 'Node.js', 'JavaScript runtime for server-side development', 3, TRUE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'typescript', 'TypeScript', 'Typed superset of JavaScript', 4, TRUE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'nextjs', 'Next.js', 'React framework for production', 5, TRUE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'css', 'CSS', 'Styling for the web', 6, FALSE
FROM subcategories s WHERE s.slug = 'web-development';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'html', 'HTML', 'Structure of web pages', 7, FALSE
FROM subcategories s WHERE s.slug = 'web-development';

-- Programming Languages Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'python', 'Python', 'Versatile programming language for web, data science, and automation', 1, TRUE
FROM subcategories s WHERE s.slug = 'programming-languages';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'java', 'Java', 'Enterprise-grade programming language', 2, FALSE
FROM subcategories s WHERE s.slug = 'programming-languages';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'golang', 'Go', 'Modern systems programming language by Google', 3, TRUE
FROM subcategories s WHERE s.slug = 'programming-languages';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'rust', 'Rust', 'Systems programming with safety and performance', 4, TRUE
FROM subcategories s WHERE s.slug = 'programming-languages';

-- Cloud Computing Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'aws', 'AWS', 'Amazon Web Services cloud platform', 1, TRUE
FROM subcategories s WHERE s.slug = 'cloud-computing';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'azure', 'Microsoft Azure', 'Microsoft cloud computing platform', 2, TRUE
FROM subcategories s WHERE s.slug = 'cloud-computing';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'gcp', 'Google Cloud', 'Google Cloud Platform services', 3, TRUE
FROM subcategories s WHERE s.slug = 'cloud-computing';

-- DevOps Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'docker', 'Docker', 'Container platform for application deployment', 1, TRUE
FROM subcategories s WHERE s.slug = 'devops';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'kubernetes', 'Kubernetes', 'Container orchestration platform', 2, TRUE
FROM subcategories s WHERE s.slug = 'devops';

-- Machine Learning Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'deep-learning', 'Deep Learning', 'Neural networks and deep learning algorithms', 1, TRUE
FROM subcategories s WHERE s.slug = 'machine-learning';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'tensorflow', 'TensorFlow', 'Google''s machine learning framework', 2, TRUE
FROM subcategories s WHERE s.slug = 'machine-learning';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'pytorch', 'PyTorch', 'Facebook''s deep learning framework', 3, TRUE
FROM subcategories s WHERE s.slug = 'machine-learning';

-- AI Topics
INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'generative-ai', 'Generative AI', 'ChatGPT, LLMs, and AI content generation', 1, TRUE
FROM subcategories s WHERE s.slug = 'artificial-intelligence';

INSERT INTO topics (subcategory_id, slug, name, description, sort_order, is_trending)
SELECT s.id, 'prompt-engineering', 'Prompt Engineering', 'Effective prompting for AI models', 2, TRUE
FROM subcategories s WHERE s.slug = 'artificial-intelligence';

-- ============================================================================
-- SKILLS (Based on most in-demand tech skills 2024/2025)
-- ============================================================================

-- Programming Languages
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('python', 'Python', 'Versatile programming language used in web development, data science, AI, and automation', 'programming_language', 'python', 150, 'beginner', ARRAY['py', 'python3']),
('javascript', 'JavaScript', 'Core language for web development, runs in browsers and Node.js', 'programming_language', 'javascript', 200, 'beginner', ARRAY['js', 'es6', 'ecmascript']),
('typescript', 'TypeScript', 'Typed superset of JavaScript for large-scale applications', 'programming_language', 'typescript', 80, 'intermediate', ARRAY['ts']),
('java', 'Java', 'Enterprise-grade language for backend systems and Android development', 'programming_language', 'java', 250, 'intermediate', NULL),
('golang', 'Go', 'Modern systems language with excellent concurrency support', 'programming_language', 'golang', 120, 'intermediate', ARRAY['go', 'golang']),
('rust', 'Rust', 'Systems programming with memory safety and high performance', 'programming_language', 'rust', 200, 'advanced', NULL),
('sql', 'SQL', 'Query language for relational databases', 'programming_language', 'database', 60, 'beginner', ARRAY['mysql', 'postgresql', 'postgres']);

-- Frameworks
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('react', 'React', 'JavaScript library for building user interfaces', 'framework', 'react', 100, 'intermediate', ARRAY['reactjs', 'react.js']),
('nextjs', 'Next.js', 'React framework for production with SSR and SSG', 'framework', 'nextjs', 80, 'intermediate', ARRAY['next', 'next.js']),
('nodejs', 'Node.js', 'JavaScript runtime for server-side development', 'framework', 'nodejs', 100, 'intermediate', ARRAY['node', 'node.js']),
('express', 'Express.js', 'Minimal web framework for Node.js', 'framework', 'express', 40, 'beginner', ARRAY['expressjs', 'express.js']),
('django', 'Django', 'Python web framework for rapid development', 'framework', 'django', 80, 'intermediate', NULL),
('flask', 'Flask', 'Lightweight Python web framework', 'framework', 'flask', 40, 'beginner', NULL),
('fastapi', 'FastAPI', 'Modern Python API framework with automatic docs', 'framework', 'fastapi', 40, 'intermediate', NULL);

-- Libraries (ML/Data)
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('tensorflow', 'TensorFlow', 'End-to-end machine learning platform', 'library', 'tensorflow', 120, 'advanced', ARRAY['tf']),
('pytorch', 'PyTorch', 'Deep learning framework for research and production', 'library', 'pytorch', 120, 'advanced', NULL),
('pandas', 'Pandas', 'Python data analysis and manipulation library', 'library', 'pandas', 40, 'beginner', NULL),
('numpy', 'NumPy', 'Python library for numerical computing', 'library', 'numpy', 30, 'beginner', NULL),
('scikit-learn', 'Scikit-learn', 'Machine learning library for Python', 'library', 'scikitlearn', 60, 'intermediate', ARRAY['sklearn']);

-- Cloud Platforms
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('aws', 'AWS', 'Amazon Web Services cloud platform', 'platform', 'aws', 150, 'intermediate', ARRAY['amazon web services']),
('azure', 'Microsoft Azure', 'Microsoft cloud computing platform', 'platform', 'azure', 120, 'intermediate', NULL),
('gcp', 'Google Cloud', 'Google Cloud Platform', 'platform', 'gcp', 120, 'intermediate', ARRAY['google cloud platform']);

-- DevOps Tools
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('docker', 'Docker', 'Container platform for building and deploying applications', 'tool', 'docker', 60, 'intermediate', NULL),
('kubernetes', 'Kubernetes', 'Container orchestration platform', 'tool', 'kubernetes', 100, 'advanced', ARRAY['k8s']),
('git', 'Git', 'Distributed version control system', 'tool', 'git', 20, 'beginner', ARRAY['github', 'gitlab']);

-- Databases
INSERT INTO skills (slug, name, description, category, icon, estimated_hours_to_learn, difficulty, aliases) VALUES
('postgresql', 'PostgreSQL', 'Advanced open-source relational database', 'database', 'postgresql', 60, 'intermediate', ARRAY['postgres']),
('mongodb', 'MongoDB', 'Document-oriented NoSQL database', 'database', 'mongodb', 40, 'beginner', ARRAY['mongo']),
('redis', 'Redis', 'In-memory data structure store', 'database', 'redis', 30, 'intermediate', NULL);

-- ============================================================================
-- SKILL PREREQUISITES
-- ============================================================================

-- TypeScript requires JavaScript
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT ts.id, js.id, TRUE
FROM skills ts, skills js
WHERE ts.slug = 'typescript' AND js.slug = 'javascript';

-- React requires JavaScript
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT react.id, js.id, TRUE
FROM skills react, skills js
WHERE react.slug = 'react' AND js.slug = 'javascript';

-- Next.js requires React
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT next.id, react.id, TRUE
FROM skills next, skills react
WHERE next.slug = 'nextjs' AND react.slug = 'react';

-- Node.js requires JavaScript
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT node.id, js.id, TRUE
FROM skills node, skills js
WHERE node.slug = 'nodejs' AND js.slug = 'javascript';

-- Express requires Node.js
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT express.id, node.id, TRUE
FROM skills express, skills node
WHERE express.slug = 'express' AND node.slug = 'nodejs';

-- Django requires Python
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT django.id, python.id, TRUE
FROM skills django, skills python
WHERE django.slug = 'django' AND python.slug = 'python';

-- FastAPI requires Python
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT fastapi.id, python.id, TRUE
FROM skills fastapi, skills python
WHERE fastapi.slug = 'fastapi' AND python.slug = 'python';

-- TensorFlow requires Python
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT tf.id, python.id, TRUE
FROM skills tf, skills python
WHERE tf.slug = 'tensorflow' AND python.slug = 'python';

-- PyTorch requires Python
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT pytorch.id, python.id, TRUE
FROM skills pytorch, skills python
WHERE pytorch.slug = 'pytorch' AND python.slug = 'python';

-- Kubernetes requires Docker
INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id, is_required)
SELECT k8s.id, docker.id, TRUE
FROM skills k8s, skills docker
WHERE k8s.slug = 'kubernetes' AND docker.slug = 'docker';

-- ============================================================================
-- COURSES (Based on Udemy top courses and enrollment data)
-- Statistics: Top Python course has 1.8M+ students
-- ============================================================================

-- Python Courses (Most popular on Udemy - 36M+ learners)
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'complete-python-bootcamp',
    'The Complete Python Bootcamp From Zero to Hero',
    'Learn Python like a professional! Start from basics and go all the way to creating your own applications.',
    'The most comprehensive Python course on the platform. Go from zero programming knowledge to building real applications.',
    E'This is the most comprehensive Python course on the platform.\n\nWhether you have never programmed before, already know basic syntax, or want to learn about the advanced features of Python, this course is for you!\n\nWith over 100 lectures and more than 20 hours of video, this course covers everything you need to know to become a Python professional.',
    t.id,
    s.id,
    'beginner',
    'published',
    22.5,
    4.7,
    567000,
    1847000,
    FALSE,
    500,
    ARRAY['Master Python from basics to advanced concepts', 'Build real-world applications and games', 'Learn object-oriented programming', 'Work with files, databases, and APIs', 'Understand decorators, generators, and functional programming'],
    ARRAY['No programming experience required', 'A computer with internet access', 'Willingness to learn'],
    ARRAY['Beginners who have never programmed before', 'Programmers switching to Python', 'Anyone who wants to learn Python for data science or web development']
FROM topics t, skills s
WHERE t.slug = 'python' AND s.slug = 'python';

-- JavaScript Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'complete-javascript-course',
    'The Complete JavaScript Course: From Zero to Expert',
    'The modern JavaScript course for everyone! Master JavaScript with real projects, challenges, and interview prep.',
    'The #1 bestselling JavaScript course! Master modern JavaScript from the very beginning, step-by-step.',
    E'JavaScript is THE most important programming language to learn as a web developer, and with this course, you will become a JavaScript expert.\n\nThis course covers everything from the basics to advanced topics like:\n- Modern ES6+ features\n- Object-Oriented Programming\n- Asynchronous JavaScript\n- DOM manipulation\n- And much more!',
    t.id,
    s.id,
    'beginner',
    'published',
    68.5,
    4.8,
    189000,
    890000,
    FALSE,
    600,
    ARRAY['JavaScript fundamentals: variables, if/else, loops, functions, arrays, objects', 'Modern JavaScript (ES6+) from the beginning', 'How the DOM works and how to manipulate it', 'Asynchronous JavaScript: promises, async/await, AJAX', 'Object-Oriented Programming: classes, prototypal inheritance'],
    ARRAY['No coding experience required', 'Any computer and OS will work'],
    ARRAY['Anyone who wants to learn JavaScript from scratch', 'Web developers looking to upgrade their skills', 'Bootcamp students who need more practice']
FROM topics t, skills s
WHERE t.slug = 'javascript' AND s.slug = 'javascript';

-- React Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'react-complete-guide',
    'React - The Complete Guide 2025 (incl. Next.js, Redux)',
    'Dive in and learn React.js from scratch! Learn React, Hooks, Redux, React Router, Next.js and more!',
    'This course will teach you React.js in a practice-oriented way, using all the latest patterns and best practices.',
    E'This course is completely up-to-date with the latest React features!\n\nLearn React, Hooks, Redux, React Router, Next.js, Best Practices and way more!\n\nThis course is for anyone who wants to learn how to build reactive, high-performance web applications. React is one of the most popular JavaScript libraries, and demand for React developers continues to grow.',
    t.id,
    s.id,
    'intermediate',
    'published',
    48.0,
    4.6,
    234000,
    920000,
    FALSE,
    550,
    ARRAY['Build powerful, fast, user-friendly and reactive web apps', 'Learn React Hooks & Components', 'Manage state with Redux and Context API', 'Build fullstack apps with Next.js', 'Use React Router for navigation'],
    ARRAY['JavaScript + HTML + CSS fundamentals required', 'ES6+ JavaScript knowledge recommended', 'No prior React or SPA experience required'],
    ARRAY['JavaScript developers who want to learn React', 'Developers who know another framework and want to learn React', 'Anyone preparing for React interviews']
FROM topics t, skills s
WHERE t.slug = 'react' AND s.slug = 'react';

-- Node.js Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'nodejs-complete-guide',
    'NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
    'Master Node.js by building a complete RESTful API and web application (including REST API with MongoDB, and GraphQL!)',
    'Node.js is probably THE most popular and modern server-side programming technology. Learn everything you need to master Node.js!',
    E'Join the most comprehensive Node.js course and start building amazing fullstack applications!\n\nThis course teaches you Node.js the practical way, with real-world projects.\n\nYou will learn:\n- The fundamentals of Node.js\n- Building REST APIs\n- GraphQL APIs\n- Server-side rendering\n- Database integration\n- And much more!',
    t.id,
    s.id,
    'intermediate',
    'published',
    40.5,
    4.7,
    156000,
    534000,
    FALSE,
    500,
    ARRAY['Build fast and scalable server-side applications', 'Create REST and GraphQL APIs', 'Work with MongoDB and SQL databases', 'Implement authentication and authorization', 'Deploy applications to production'],
    ARRAY['JavaScript knowledge is required', 'Basic understanding of web technologies', 'No prior Node.js experience needed'],
    ARRAY['Developers who want to learn backend development', 'Frontend developers looking to become full-stack', 'Anyone interested in server-side JavaScript']
FROM topics t, skills s
WHERE t.slug = 'nodejs' AND s.slug = 'nodejs';

-- AWS Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'aws-certified-solutions-architect',
    'AWS Certified Solutions Architect Associate 2025',
    'Pass the AWS Solutions Architect Associate Certification SAA-C03. Master AWS cloud architecture!',
    'The most comprehensive course to pass the AWS Solutions Architect Associate exam and become an AWS professional.',
    E'This course is designed to help you pass the AWS Solutions Architect Associate exam on your first try!\n\nAWS is the #1 cloud provider, and this certification is one of the most valuable in the IT industry.\n\nWith hands-on practice and real-world scenarios, you will gain the skills needed to design distributed systems on AWS.',
    t.id,
    s.id,
    'intermediate',
    'published',
    27.0,
    4.7,
    245000,
    890000,
    FALSE,
    450,
    ARRAY['Pass the AWS Solutions Architect Associate exam', 'Master core AWS services (EC2, S3, VPC, RDS, IAM)', 'Design highly available and fault-tolerant architectures', 'Implement security best practices', 'Optimize costs and performance on AWS'],
    ARRAY['Basic IT knowledge', 'No prior AWS experience required', 'Willingness to create a free AWS account'],
    ARRAY['IT professionals looking to get AWS certified', 'Developers who want to understand cloud architecture', 'Solution architects and DevOps engineers']
FROM topics t, skills s
WHERE t.slug = 'aws' AND s.slug = 'aws';

-- Docker Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'docker-kubernetes-complete-guide',
    'Docker and Kubernetes: The Complete Guide',
    'Build, test, and deploy Docker applications with Kubernetes while learning production-style development workflows',
    'Master Docker and Kubernetes with this hands-on, practical course. Build real applications and deploy to the cloud.',
    E'Docker and Kubernetes are transforming the way software is developed and deployed.\n\nThis course will teach you everything you need to know about containerization and orchestration, from basic concepts to advanced production deployments.',
    t.id,
    s.id,
    'intermediate',
    'published',
    22.0,
    4.6,
    87000,
    356000,
    FALSE,
    400,
    ARRAY['Understand Docker from scratch with hands-on examples', 'Build and deploy multi-container applications', 'Master Kubernetes deployments and services', 'Set up CI/CD pipelines with Docker', 'Deploy to AWS, Google Cloud, and Azure'],
    ARRAY['Basic command line knowledge', 'Some programming experience recommended', 'No Docker/Kubernetes experience needed'],
    ARRAY['Developers who want to learn containers', 'DevOps engineers', 'Anyone interested in modern deployment practices']
FROM topics t, skills s
WHERE t.slug = 'docker' AND s.slug = 'docker';

-- Machine Learning Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'machine-learning-az',
    'Machine Learning A-Z: AI, Python & R + ChatGPT Prize',
    'Learn to create Machine Learning algorithms in Python and R. Includes Artificial Neural Networks, Reinforcement Learning.',
    'The most comprehensive machine learning course on the platform. Learn from two Data Science experts with real-world examples.',
    E'This course is jam-packed with knowledge:\n\n• Data Preprocessing\n• Regression: Simple Linear, Multiple, Polynomial\n• Classification: Logistic, K-NN, SVM, Kernel SVM, Naive Bayes, Decision Tree, Random Forest\n• Clustering: K-Means, Hierarchical\n• Association Rule Learning\n• Reinforcement Learning\n• Natural Language Processing\n• Deep Learning\n• Dimensionality Reduction\n• Model Selection & Boosting',
    t.id,
    s.id,
    'intermediate',
    'published',
    43.0,
    4.5,
    178000,
    987000,
    FALSE,
    550,
    ARRAY['Master Machine Learning on Python & R', 'Make accurate predictions and powerful analysis', 'Build robust Machine Learning models', 'Create strong value for any business', 'Handle advanced topics like Reinforcement Learning and NLP'],
    ARRAY['Basic math knowledge (high school level)', 'Basic programming knowledge is helpful but not required'],
    ARRAY['Anyone interested in Machine Learning', 'Data analysts wanting to level up', 'Students who want practical ML skills']
FROM topics t, skills s
WHERE t.slug = 'deep-learning' AND s.slug = 'tensorflow';

-- TypeScript Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'understanding-typescript',
    'Understanding TypeScript - 2025 Edition',
    'Don''t limit the usage of TypeScript to Angular! Learn the basics, advanced features, and how to use TypeScript in any project.',
    'Learn TypeScript from scratch and understand why it''s crucial for modern JavaScript development.',
    E'TypeScript is getting more and more popular every year. It adds type safety to JavaScript, catches errors early, and makes your code more maintainable.\n\nThis course teaches TypeScript from scratch:\n- Core types and compiler configuration\n- Classes, interfaces, and generics\n- Decorators and modules\n- TypeScript with React and Node.js\n- Advanced patterns and best practices',
    t.id,
    s.id,
    'intermediate',
    'published',
    15.0,
    4.7,
    56000,
    267000,
    FALSE,
    350,
    ARRAY['Use TypeScript and its features like types, ES6 support, classes, modules', 'Understand TypeScript''s core concepts', 'Configure TypeScript for any project', 'Use TypeScript with React, Node.js, and other libraries', 'Write better, more maintainable code'],
    ARRAY['JavaScript knowledge is required', 'No prior TypeScript experience needed', 'Basic ES6 knowledge is helpful'],
    ARRAY['JavaScript developers who want to learn TypeScript', 'Angular, React, or Vue developers', 'Anyone who wants to write better JavaScript']
FROM topics t, skills s
WHERE t.slug = 'typescript' AND s.slug = 'typescript';

-- Next.js Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'nextjs-complete-guide',
    'Next.js & React - The Complete Guide (App Router Edition)',
    'Learn Next.js App Router, Server Components, Server Actions, and build fullstack React apps with the latest features!',
    'Master Next.js 14+ and build production-ready React applications with the new App Router.',
    E'Next.js is THE most popular React framework for building production applications.\n\nThis course covers the latest App Router features:\n- Server Components and Client Components\n- Data Fetching patterns\n- Server Actions\n- Route Handlers\n- Middleware\n- Authentication\n- And deployment!',
    t.id,
    s.id,
    'intermediate',
    'published',
    25.0,
    4.8,
    34000,
    145000,
    FALSE,
    450,
    ARRAY['Build production-ready React applications with Next.js', 'Master the App Router and Server Components', 'Implement authentication and authorization', 'Connect to databases and deploy to production', 'Understand SSR, SSG, and ISR'],
    ARRAY['React knowledge required', 'JavaScript/TypeScript fundamentals', 'No prior Next.js experience needed'],
    ARRAY['React developers wanting to build fullstack apps', 'Developers preparing for senior roles', 'Anyone interested in modern React patterns']
FROM topics t, skills s
WHERE t.slug = 'nextjs' AND s.slug = 'nextjs';

-- Generative AI Course
INSERT INTO courses (slug, title, subtitle, description, long_description, topic_id, primary_skill_id, difficulty, status, estimated_hours, avg_rating, rating_count, enrollment_count, is_free, xp_reward, what_you_will_learn, requirements, target_audience)
SELECT
    'generative-ai-complete-guide',
    'Generative AI & ChatGPT: The Complete Developer Guide',
    'Build AI-powered applications with ChatGPT, GPT-4, and other Large Language Models. Prompt engineering and API integration.',
    'Master Generative AI as a developer. Learn to build applications powered by ChatGPT, GPT-4, and other LLMs.',
    E'Generative AI is revolutionizing how we build software.\n\nThis course teaches you how to harness the power of Large Language Models:\n- ChatGPT and GPT-4 API integration\n- Prompt engineering best practices\n- Building AI-powered applications\n- RAG (Retrieval Augmented Generation)\n- Fine-tuning and embeddings\n- Production deployment strategies',
    t.id,
    s.id,
    'intermediate',
    'published',
    18.0,
    4.7,
    23000,
    134000,
    FALSE,
    400,
    ARRAY['Integrate ChatGPT and GPT-4 into your applications', 'Master prompt engineering techniques', 'Build RAG systems with vector databases', 'Create AI-powered chatbots and assistants', 'Deploy AI applications to production'],
    ARRAY['Basic programming knowledge', 'Python recommended but not required', 'No prior AI experience needed'],
    ARRAY['Developers who want to build AI applications', 'Product managers and tech leads', 'Anyone curious about practical AI development']
FROM topics t, skills s
WHERE t.slug = 'generative-ai' AND s.slug = 'python';

-- ============================================================================
-- ADD CHAPTERS TO COURSES
-- ============================================================================

-- Python Bootcamp Chapters
INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'python-basics', 'Python Basics', 'Get started with Python fundamentals', 1, 180, 100
FROM courses c WHERE c.slug = 'complete-python-bootcamp';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'data-structures', 'Data Structures', 'Lists, dictionaries, sets, and tuples', 2, 240, 120
FROM courses c WHERE c.slug = 'complete-python-bootcamp';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'functions-modules', 'Functions and Modules', 'Writing reusable Python code', 3, 200, 100
FROM courses c WHERE c.slug = 'complete-python-bootcamp';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'oop-python', 'Object-Oriented Programming', 'Classes, inheritance, and polymorphism', 4, 280, 150
FROM courses c WHERE c.slug = 'complete-python-bootcamp';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'advanced-python', 'Advanced Python', 'Decorators, generators, and more', 5, 200, 130
FROM courses c WHERE c.slug = 'complete-python-bootcamp';

-- JavaScript Course Chapters
INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'js-fundamentals', 'JavaScript Fundamentals', 'Variables, data types, and operators', 1, 360, 100
FROM courses c WHERE c.slug = 'complete-javascript-course';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'dom-manipulation', 'DOM Manipulation', 'Selecting and manipulating DOM elements', 2, 300, 120
FROM courses c WHERE c.slug = 'complete-javascript-course';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'async-javascript', 'Asynchronous JavaScript', 'Promises, async/await, and AJAX', 3, 400, 150
FROM courses c WHERE c.slug = 'complete-javascript-course';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'js-oop', 'OOP in JavaScript', 'Prototypes, classes, and inheritance', 4, 320, 130
FROM courses c WHERE c.slug = 'complete-javascript-course';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'modern-js', 'Modern JavaScript Features', 'ES6+ features and best practices', 5, 280, 120
FROM courses c WHERE c.slug = 'complete-javascript-course';

-- React Course Chapters
INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'react-basics', 'React Basics', 'Components, JSX, and props', 1, 300, 100
FROM courses c WHERE c.slug = 'react-complete-guide';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'react-state', 'State and Events', 'Managing state with useState and handling events', 2, 280, 120
FROM courses c WHERE c.slug = 'react-complete-guide';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'react-hooks', 'Advanced Hooks', 'useEffect, useContext, useReducer, and custom hooks', 3, 360, 150
FROM courses c WHERE c.slug = 'react-complete-guide';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'react-routing', 'React Router', 'Building multi-page SPAs', 4, 240, 100
FROM courses c WHERE c.slug = 'react-complete-guide';

INSERT INTO chapters (course_id, slug, title, description, sort_order, estimated_minutes, xp_reward)
SELECT c.id, 'react-redux', 'Redux', 'Global state management with Redux Toolkit', 5, 300, 130
FROM courses c WHERE c.slug = 'react-complete-guide';

-- ============================================================================
-- ADD SECTIONS TO CHAPTERS
-- ============================================================================

-- Python Basics Chapter Sections
INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'intro-to-python', 'Introduction to Python', 'What is Python and why learn it?', 'video', 1, 15, 10, TRUE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-python-bootcamp' AND ch.slug = 'python-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'installing-python', 'Setting Up Python', 'Installing Python and your development environment', 'video', 2, 20, 10, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-python-bootcamp' AND ch.slug = 'python-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'variables-data-types', 'Variables and Data Types', 'Understanding variables, numbers, strings, and booleans', 'lesson', 3, 30, 15, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-python-bootcamp' AND ch.slug = 'python-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'operators', 'Operators in Python', 'Arithmetic, comparison, and logical operators', 'lesson', 4, 25, 15, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-python-bootcamp' AND ch.slug = 'python-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'python-basics-quiz', 'Python Basics Quiz', 'Test your understanding of Python basics', 'quiz', 5, 15, 20, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-python-bootcamp' AND ch.slug = 'python-basics';

-- JavaScript Fundamentals Chapter Sections
INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'what-is-javascript', 'What is JavaScript?', 'History and role of JavaScript in web development', 'video', 1, 12, 10, TRUE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-javascript-course' AND ch.slug = 'js-fundamentals';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'js-variables', 'Variables: let, const, and var', 'Understanding variable declarations in JavaScript', 'lesson', 2, 25, 15, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-javascript-course' AND ch.slug = 'js-fundamentals';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'js-data-types', 'Data Types', 'Primitives, objects, and type coercion', 'lesson', 3, 30, 15, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-javascript-course' AND ch.slug = 'js-fundamentals';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'js-coding-challenge', 'Coding Challenge: Variables & Data Types', 'Practice what you learned', 'exercise', 4, 20, 25, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'complete-javascript-course' AND ch.slug = 'js-fundamentals';

-- React Basics Chapter Sections
INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'what-is-react', 'What is React?', 'Introduction to React and its ecosystem', 'video', 1, 10, 10, TRUE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'react-complete-guide' AND ch.slug = 'react-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'components-jsx', 'Components and JSX', 'Building your first React components', 'lesson', 2, 35, 20, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'react-complete-guide' AND ch.slug = 'react-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'props-basics', 'Props Fundamentals', 'Passing data between components', 'lesson', 3, 30, 20, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'react-complete-guide' AND ch.slug = 'react-basics';

INSERT INTO sections (chapter_id, slug, title, description, content_type, sort_order, estimated_minutes, xp_reward, is_preview)
SELECT ch.id, 'first-react-project', 'Project: Build an Expense Tracker', 'Apply your knowledge in a real project', 'project', 4, 60, 50, FALSE
FROM chapters ch
JOIN courses c ON ch.course_id = c.id
WHERE c.slug = 'react-complete-guide' AND ch.slug = 'react-basics';

-- ============================================================================
-- COURSE SKILLS (which skills each course teaches)
-- ============================================================================

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'complete-python-bootcamp' AND s.slug = 'python';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'complete-javascript-course' AND s.slug = 'javascript';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'react-complete-guide' AND s.slug = 'react';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'beginner', FALSE
FROM courses c, skills s WHERE c.slug = 'react-complete-guide' AND s.slug = 'typescript';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'nodejs-complete-guide' AND s.slug = 'nodejs';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'beginner', FALSE
FROM courses c, skills s WHERE c.slug = 'nodejs-complete-guide' AND s.slug = 'express';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'aws-certified-solutions-architect' AND s.slug = 'aws';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'docker-kubernetes-complete-guide' AND s.slug = 'docker';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'beginner', FALSE
FROM courses c, skills s WHERE c.slug = 'docker-kubernetes-complete-guide' AND s.slug = 'kubernetes';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'machine-learning-az' AND s.slug = 'tensorflow';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', FALSE
FROM courses c, skills s WHERE c.slug = 'machine-learning-az' AND s.slug = 'scikit-learn';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'understanding-typescript' AND s.slug = 'typescript';

INSERT INTO course_skills (course_id, skill_id, proficiency_gained, is_primary)
SELECT c.id, s.id, 'intermediate', TRUE
FROM courses c, skills s WHERE c.slug = 'nextjs-complete-guide' AND s.slug = 'nextjs';

-- ============================================================================
-- COURSE CONNECTIONS (for Knowledge Map)
-- ============================================================================

-- JavaScript is a prerequisite for React
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'prerequisite', 8, 'Required: JS fundamentals'
FROM courses c1, courses c2
WHERE c1.slug = 'complete-javascript-course' AND c2.slug = 'react-complete-guide';

-- JavaScript is a prerequisite for Node.js
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'prerequisite', 8, 'Required: JS fundamentals'
FROM courses c1, courses c2
WHERE c1.slug = 'complete-javascript-course' AND c2.slug = 'nodejs-complete-guide';

-- React is recommended before Next.js
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'prerequisite', 9, 'Required: React fundamentals'
FROM courses c1, courses c2
WHERE c1.slug = 'react-complete-guide' AND c2.slug = 'nextjs-complete-guide';

-- JavaScript leads to TypeScript
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'next', 7, 'Recommended next step'
FROM courses c1, courses c2
WHERE c1.slug = 'complete-javascript-course' AND c2.slug = 'understanding-typescript';

-- Python is prerequisite for ML
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'prerequisite', 9, 'Required: Python basics'
FROM courses c1, courses c2
WHERE c1.slug = 'complete-python-bootcamp' AND c2.slug = 'machine-learning-az';

-- Docker before Kubernetes section of Docker course implies Docker basics needed
INSERT INTO course_connections (from_course_id, to_course_id, connection_type, weight, label)
SELECT c1.id, c2.id, 'related', 6, 'Cloud deployment skills'
FROM courses c1, courses c2
WHERE c1.slug = 'docker-kubernetes-complete-guide' AND c2.slug = 'aws-certified-solutions-architect';

-- ============================================================================
-- LEARNING PATHS (Based on common career paths)
-- ============================================================================

INSERT INTO learning_paths (slug, title, subtitle, description, path_type, status, target_role, estimated_weeks, estimated_hours, course_count, skill_count, icon, color) VALUES
('full-stack-developer', 'Full Stack Web Developer Path', 'Become a complete web developer from frontend to backend', 'Master both frontend and backend technologies to build complete web applications. This path covers JavaScript, React, Node.js, and databases.', 'career', 'published', 'Full Stack Developer', 24, 200, 4, 8, 'Layers', '#7C3AED'),
('python-data-scientist', 'Python Data Scientist Path', 'From Python basics to machine learning expert', 'Start with Python fundamentals and progress to data analysis, visualization, and machine learning with real-world projects.', 'career', 'published', 'Data Scientist', 20, 150, 3, 6, 'Brain', '#0891B2'),
('cloud-devops-engineer', 'Cloud & DevOps Engineer Path', 'Master cloud platforms and DevOps practices', 'Learn AWS, Docker, Kubernetes, and CI/CD pipelines to become a cloud and DevOps professional.', 'career', 'published', 'DevOps Engineer', 16, 100, 2, 5, 'Cloud', '#2563EB');

-- Add courses to learning paths
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 1, TRUE, 'JavaScript Foundations', 'You can now build interactive web pages'
FROM learning_paths lp, courses c
WHERE lp.slug = 'full-stack-developer' AND c.slug = 'complete-javascript-course';

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 2, TRUE, 'Frontend Developer', 'You can build modern React applications'
FROM learning_paths lp, courses c
WHERE lp.slug = 'full-stack-developer' AND c.slug = 'react-complete-guide';

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 3, TRUE, 'Backend Developer', 'You can create server-side APIs'
FROM learning_paths lp, courses c
WHERE lp.slug = 'full-stack-developer' AND c.slug = 'nodejs-complete-guide';

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 4, TRUE, 'Full Stack Developer', 'You can build complete web applications'
FROM learning_paths lp, courses c
WHERE lp.slug = 'full-stack-developer' AND c.slug = 'nextjs-complete-guide';

-- Python Data Scientist Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 1, TRUE, 'Python Foundations', 'You can write Python code'
FROM learning_paths lp, courses c
WHERE lp.slug = 'python-data-scientist' AND c.slug = 'complete-python-bootcamp';

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 2, TRUE, 'Machine Learning Practitioner', 'You can build ML models'
FROM learning_paths lp, courses c
WHERE lp.slug = 'python-data-scientist' AND c.slug = 'machine-learning-az';

-- Cloud DevOps Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 1, TRUE, 'Containerization Expert', 'You can containerize applications'
FROM learning_paths lp, courses c
WHERE lp.slug = 'cloud-devops-engineer' AND c.slug = 'docker-kubernetes-complete-guide';

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order, is_required, milestone_title, milestone_description)
SELECT lp.id, c.id, 2, TRUE, 'AWS Certified', 'You understand cloud architecture'
FROM learning_paths lp, courses c
WHERE lp.slug = 'cloud-devops-engineer' AND c.slug = 'aws-certified-solutions-architect';

-- ============================================================================
-- CAREER GOALS
-- ============================================================================

INSERT INTO career_goals (slug, title, description, avg_salary_min, avg_salary_max, avg_salary_median, demand_level, job_growth_rate, typical_duration_months, typical_courses)
SELECT
    'full-stack-developer',
    'Become a Full Stack Developer',
    'Full stack developers build complete web applications, handling both frontend user interfaces and backend server logic. They are highly sought after for their versatility.',
    85000,
    150000,
    110000,
    'Very High',
    15.0,
    6,
    4;

INSERT INTO career_goals (slug, title, description, avg_salary_min, avg_salary_max, avg_salary_median, demand_level, job_growth_rate, typical_duration_months, typical_courses)
SELECT
    'data-scientist',
    'Become a Data Scientist',
    'Data scientists analyze complex data to help companies make decisions. They use statistics, machine learning, and programming to extract insights.',
    95000,
    160000,
    125000,
    'Very High',
    22.0,
    5,
    3;

INSERT INTO career_goals (slug, title, description, avg_salary_min, avg_salary_max, avg_salary_median, demand_level, job_growth_rate, typical_duration_months, typical_courses)
SELECT
    'devops-engineer',
    'Become a DevOps Engineer',
    'DevOps engineers bridge development and operations, automating deployment pipelines and managing cloud infrastructure.',
    100000,
    170000,
    130000,
    'High',
    18.0,
    4,
    2;

INSERT INTO career_goals (slug, title, description, avg_salary_min, avg_salary_max, avg_salary_median, demand_level, job_growth_rate, typical_duration_months, typical_courses)
SELECT
    'frontend-developer',
    'Become a Frontend Developer',
    'Frontend developers create the user-facing parts of websites and applications using HTML, CSS, JavaScript, and modern frameworks.',
    70000,
    130000,
    95000,
    'Very High',
    13.0,
    4,
    3;

-- Link career goals to recommended paths
UPDATE career_goals SET recommended_path_id = (SELECT id FROM learning_paths WHERE slug = 'full-stack-developer')
WHERE slug = 'full-stack-developer';

UPDATE career_goals SET recommended_path_id = (SELECT id FROM learning_paths WHERE slug = 'python-data-scientist')
WHERE slug = 'data-scientist';

UPDATE career_goals SET recommended_path_id = (SELECT id FROM learning_paths WHERE slug = 'cloud-devops-engineer')
WHERE slug = 'devops-engineer';

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

INSERT INTO achievements (slug, title, description, achievement_type, requirement_json, xp_reward, rarity, icon, color) VALUES
('first-lesson', 'First Steps', 'Complete your first lesson', 'milestone', '{"type": "sections_completed", "count": 1}', 50, 'common', 'Footprints', '#22C55E'),
('week-streak', 'Week Warrior', 'Maintain a 7-day learning streak', 'streak', '{"type": "streak", "days": 7}', 200, 'uncommon', 'Flame', '#F59E0B'),
('month-streak', 'Monthly Master', 'Maintain a 30-day learning streak', 'streak', '{"type": "streak", "days": 30}', 500, 'rare', 'Flame', '#EF4444'),
('first-course', 'Course Completed', 'Complete your first course', 'course', '{"type": "courses_completed", "count": 1}', 300, 'uncommon', 'GraduationCap', '#3B82F6'),
('five-courses', 'Dedicated Learner', 'Complete 5 courses', 'course', '{"type": "courses_completed", "count": 5}', 1000, 'rare', 'Trophy', '#A855F7'),
('first-skill', 'Skill Acquired', 'Reach intermediate level in any skill', 'skill', '{"type": "skill_level", "level": "intermediate"}', 150, 'common', 'Zap', '#06B6D4'),
('polyglot', 'Polyglot Developer', 'Learn 3 different programming languages', 'skill', '{"type": "programming_languages", "count": 3}', 750, 'epic', 'Languages', '#8B5CF6'),
('path-complete', 'Path Finder', 'Complete a learning path', 'path', '{"type": "paths_completed", "count": 1}', 1500, 'epic', 'Map', '#EC4899'),
('century-xp', 'Century Club', 'Earn 10,000 XP', 'milestone', '{"type": "total_xp", "amount": 10000}', 500, 'rare', 'Star', '#FBBF24'),
('legendary-learner', 'Legendary Learner', 'Earn 100,000 XP', 'milestone', '{"type": "total_xp", "amount": 100000}', 5000, 'legendary', 'Crown', '#F97316');

-- ============================================================================
-- DONE - Seed data based on Udemy statistics
-- Categories: Development (most popular), IT & Software, Data Science, Business, Design
-- Top skills: Python (36M+), JavaScript (12M+), React, AWS, Docker
-- Enrollment numbers reflect relative popularity on Udemy
-- ============================================================================
