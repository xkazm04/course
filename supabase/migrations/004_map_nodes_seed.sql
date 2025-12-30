-- ============================================================================
-- Map Nodes Seed Data
-- Creates initial map structure for the learning platform
-- ============================================================================

-- ============================================================================
-- DOMAIN NODES (Top Level - depth 0)
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, gradient, description, long_description, estimated_hours, difficulty, sort_order) VALUES

-- Frontend Domain
('frontend', 'Frontend', NULL, 'frontend', 0, 'domain', 'Monitor', '#6366f1',
 'from-indigo-500 via-purple-500 to-pink-500',
 'Craft beautiful, interactive user interfaces',
 'Frontend development focuses on building the visual and interactive parts of websites and applications that users directly interact with. Master HTML, CSS, JavaScript, and modern frameworks like React and Vue to create stunning user experiences.',
 500, 'beginner', 1),

-- Fullstack Domain
('fullstack', 'Fullstack', NULL, 'fullstack', 0, 'domain', 'Layers', '#a855f7',
 'from-violet-500 via-purple-600 to-indigo-600',
 'Master the complete technology stack',
 'Fullstack development combines frontend and backend skills to build complete web applications. Learn to handle everything from user interfaces to server logic, databases, and deployment.',
 800, 'intermediate', 2),

-- Mobile Domain
('mobile', 'Mobile', NULL, 'mobile', 0, 'domain', 'Smartphone', '#ec4899',
 'from-rose-500 via-pink-500 to-fuchsia-500',
 'Build native mobile experiences',
 'Mobile development focuses on creating applications for iOS and Android devices. Learn native development with Swift/Kotlin or cross-platform frameworks like React Native and Flutter.',
 600, 'intermediate', 3),

-- Games Domain
('games', 'Games', NULL, 'games', 0, 'domain', 'Gamepad2', '#f97316',
 'from-orange-500 via-amber-500 to-yellow-500',
 'Create immersive gaming experiences',
 'Game development combines programming, art, and design to create interactive entertainment. Learn game engines like Unity and Unreal, physics, AI, and game design principles.',
 700, 'intermediate', 4),

-- Backend Domain
('backend', 'Backend', NULL, 'backend', 0, 'domain', 'Server', '#10b981',
 'from-emerald-500 via-teal-500 to-cyan-500',
 'Power the server infrastructure',
 'Backend development focuses on server-side logic, APIs, databases, and system architecture. Build scalable, secure applications that power modern software.',
 600, 'intermediate', 5),

-- Databases Domain
('databases', 'Databases', NULL, 'databases', 0, 'domain', 'Database', '#06b6d4',
 'from-cyan-500 via-sky-500 to-blue-500',
 'Architect robust data systems',
 'Database engineering covers data modeling, SQL, NoSQL, performance optimization, and data architecture. Learn to design and manage the data layer of applications.',
 400, 'intermediate', 6);

-- ============================================================================
-- FRONTEND TOPIC NODES (depth 1)
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'html-css-basics',
    'HTML & CSS Basics',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'topic', 'FileCode', '#6366f1',
    'Learn the foundational building blocks of the web',
    40, 'beginner', 1;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'javascript-fundamentals',
    'JavaScript Fundamentals',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'topic', 'Braces', '#f59e0b',
    'Master the programming language of the web',
    80, 'beginner', 2;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'react-ecosystem',
    'React Ecosystem',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'topic', 'Atom', '#61dafb',
    'Build modern user interfaces with React',
    120, 'intermediate', 3;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'typescript',
    'TypeScript',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'topic', 'FileType', '#3178c6',
    'Add type safety to your JavaScript',
    60, 'intermediate', 4;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'nextjs',
    'Next.js',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'topic', 'Triangle', '#000000',
    'Build production-ready React applications',
    80, 'intermediate', 5;

-- ============================================================================
-- GROUP NODES (Special categorization nodes)
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, is_group_node, icon, color, description, sort_order)
SELECT
    'performance-group',
    'Performance',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'group', TRUE, 'Gauge', '#374151',
    'Optimization and performance techniques',
    10;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, is_group_node, icon, color, description, sort_order)
SELECT
    'security-group',
    'Security',
    (SELECT id FROM map_nodes WHERE slug = 'fullstack'),
    'fullstack', 1, 'group', TRUE, 'Shield', '#374151',
    'Security best practices and patterns',
    10;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, is_group_node, icon, color, description, sort_order)
SELECT
    'ui-design-group',
    'UI Design',
    (SELECT id FROM map_nodes WHERE slug = 'frontend'),
    'frontend', 1, 'group', TRUE, 'Palette', '#374151',
    'User interface design principles',
    11;

-- ============================================================================
-- SKILL NODES (depth 2) - Under React Ecosystem
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, long_description, estimated_hours, difficulty, what_you_will_learn, sort_order)
SELECT
    'react-components',
    'React Components',
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'frontend', 2, 'skill', 'Component', '#61dafb',
    'Build reusable UI components',
    'Components are the building blocks of React applications. Learn to create, compose, and manage components effectively using JSX, props, and modern patterns.',
    15, 'beginner',
    ARRAY['Create functional components', 'Use JSX syntax', 'Pass and validate props', 'Compose components together'],
    1;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, long_description, estimated_hours, difficulty, what_you_will_learn, sort_order)
SELECT
    'react-hooks',
    'React Hooks',
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'frontend', 2, 'skill', 'Anchor', '#61dafb',
    'Master React state and lifecycle',
    'Hooks are functions that let you use state and other React features in functional components. Master useState, useEffect, useContext, and learn to create custom hooks.',
    25, 'intermediate',
    ARRAY['Use useState for state management', 'Handle side effects with useEffect', 'Share logic with custom hooks', 'Optimize with useMemo and useCallback'],
    2;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'react-state-management',
    'State Management',
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'frontend', 2, 'skill', 'GitBranch', '#61dafb',
    'Manage complex application state',
    30, 'intermediate', 3;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'react-routing',
    'React Router',
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'frontend', 2, 'skill', 'Navigation', '#61dafb',
    'Build multi-page single-page applications',
    15, 'intermediate', 4;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'react-forms',
    'Forms & Validation',
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'frontend', 2, 'skill', 'FormInput', '#61dafb',
    'Handle user input and validation',
    20, 'intermediate', 5;

-- ============================================================================
-- BACKEND TOPIC NODES (depth 1)
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'nodejs-backend',
    'Node.js Backend',
    (SELECT id FROM map_nodes WHERE slug = 'backend'),
    'backend', 1, 'topic', 'Hexagon', '#339933',
    'Build scalable server applications with JavaScript',
    100, 'intermediate', 1;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'python-backend',
    'Python Backend',
    (SELECT id FROM map_nodes WHERE slug = 'backend'),
    'backend', 1, 'topic', 'FileCode', '#3776ab',
    'Build robust APIs with Python',
    100, 'intermediate', 2;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'api-design',
    'API Design',
    (SELECT id FROM map_nodes WHERE slug = 'backend'),
    'backend', 1, 'topic', 'Webhook', '#10b981',
    'Design RESTful and GraphQL APIs',
    60, 'intermediate', 3;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'authentication',
    'Authentication & Authorization',
    (SELECT id FROM map_nodes WHERE slug = 'backend'),
    'backend', 1, 'topic', 'Lock', '#ef4444',
    'Secure your applications',
    40, 'intermediate', 4;

-- ============================================================================
-- DATABASE TOPIC NODES (depth 1)
-- ============================================================================

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'sql-fundamentals',
    'SQL Fundamentals',
    (SELECT id FROM map_nodes WHERE slug = 'databases'),
    'databases', 1, 'topic', 'Table2', '#06b6d4',
    'Master the language of relational databases',
    40, 'beginner', 1;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'postgresql',
    'PostgreSQL',
    (SELECT id FROM map_nodes WHERE slug = 'databases'),
    'databases', 1, 'topic', 'Database', '#336791',
    'Advanced PostgreSQL features and optimization',
    60, 'intermediate', 2;

INSERT INTO map_nodes (slug, name, parent_id, domain_id, depth, node_type, icon, color, description, estimated_hours, difficulty, sort_order)
SELECT
    'nosql-databases',
    'NoSQL Databases',
    (SELECT id FROM map_nodes WHERE slug = 'databases'),
    'databases', 1, 'topic', 'Layers', '#4db33d',
    'MongoDB, Redis, and document databases',
    50, 'intermediate', 3;

-- ============================================================================
-- NODE CONNECTIONS (Prerequisites)
-- ============================================================================

-- JavaScript is prerequisite for React
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'javascript-fundamentals'),
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    'prerequisite', 9, 'Required: JavaScript fundamentals';

-- HTML/CSS before JavaScript
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'html-css-basics'),
    (SELECT id FROM map_nodes WHERE slug = 'javascript-fundamentals'),
    'prerequisite', 8, 'Recommended: HTML/CSS basics';

-- JavaScript before TypeScript
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'javascript-fundamentals'),
    (SELECT id FROM map_nodes WHERE slug = 'typescript'),
    'prerequisite', 9, 'Required: JavaScript knowledge';

-- React before Next.js
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'react-ecosystem'),
    (SELECT id FROM map_nodes WHERE slug = 'nextjs'),
    'prerequisite', 10, 'Required: React fundamentals';

-- React Components before Hooks
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'react-components'),
    (SELECT id FROM map_nodes WHERE slug = 'react-hooks'),
    'prerequisite', 9, 'Learn components first';

-- Hooks before State Management
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'react-hooks'),
    (SELECT id FROM map_nodes WHERE slug = 'react-state-management'),
    'prerequisite', 8, 'Understand hooks first';

-- SQL before PostgreSQL
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight, label)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'sql-fundamentals'),
    (SELECT id FROM map_nodes WHERE slug = 'postgresql'),
    'prerequisite', 9, 'Learn SQL basics first';

-- ============================================================================
-- GROUP MEMBERSHIPS
-- ============================================================================

-- Performance-related nodes connect to Performance group
INSERT INTO map_node_connections (from_node_id, to_node_id, connection_type, weight)
SELECT
    (SELECT id FROM map_nodes WHERE slug = 'react-hooks'),
    (SELECT id FROM map_nodes WHERE slug = 'performance-group'),
    'group_member', 5;

-- ============================================================================
-- DONE
-- ============================================================================
