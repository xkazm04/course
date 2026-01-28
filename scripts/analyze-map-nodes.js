const fs = require('fs');
const path = require('path');

// Read the saved output
const dataPath = path.join(__dirname, '..', 'src', 'test', 'fixtures', 'map-nodes.json');

// First, fetch fresh data if running with --fetch flag
if (process.argv.includes('--fetch')) {
    const http = require('http');
    http.get('http://localhost:3000/api/map/nodes', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            fs.mkdirSync(path.dirname(dataPath), { recursive: true });
            fs.writeFileSync(dataPath, data);
            console.log('Saved to', dataPath);
            analyzeData(JSON.parse(data));
        });
    }).on('error', err => {
        console.error('Fetch error:', err.message);
    });
} else {
    // Read existing file
    if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        analyzeData(data);
    } else {
        console.log('Run with --fetch to download data first');
    }
}

function analyzeData(data) {
    const nodes = data.nodes || [];

    // Count by depth
    const byDepth = {};
    const byType = {};
    for (const n of nodes) {
        byDepth[n.depth] = (byDepth[n.depth] || 0) + 1;
        byType[n.node_type] = (byType[n.node_type] || 0) + 1;
    }

    console.log('Total nodes:', nodes.length);
    console.log('By depth:', byDepth);
    console.log('By type:', byType);
    console.log();

    // Show sample node at each depth
    const shown = new Set();
    for (const n of nodes) {
        if (!shown.has(n.depth)) {
            shown.add(n.depth);
            console.log(`\nDepth ${n.depth} (${n.node_type}):`);
            console.log('  id:', n.id);
            console.log('  name:', n.name);
            console.log('  parent_id:', n.parent_id);
            console.log('  total_children:', n.total_children);
        }
    }

    // Output summary for test fixture
    console.log('\n\n--- Test Fixture Summary ---');
    console.log('Depths:', Object.keys(byDepth).sort().join(', '));
    console.log('Types:', Object.keys(byType).join(', '));
}
