# Hex Investigation Dashboard: Hackathon Quick-Start Guide

> A step-by-step guide for uploading CSV data, leveraging Hex AI features, and building compelling investigation dashboards.

---

## Table of Contents

1. [Overview](#overview)
2. [Recommended Data Schemas](#recommended-data-schemas)
3. [Step 1: Upload Your CSV Data](#step-1-upload-your-csv-data)
4. [Step 2: Explore Data with AI Threads](#step-2-explore-data-with-ai-threads)
5. [Step 3: Build Analysis with Notebook Agent](#step-3-build-analysis-with-notebook-agent)
6. [Step 4: Create Semantic Models (Optional Advanced)](#step-4-create-semantic-models-optional-advanced)
7. [Step 5: Design Your Dashboard](#step-5-design-your-dashboard)
8. [Dashboard Layout Recommendations](#dashboard-layout-recommendations)
9. [Effective Prompts for Hex AI](#effective-prompts-for-hex-ai)
10. [Publishing and Sharing](#publishing-and-sharing)

---

## Overview

This guide walks you through building an investigation dashboard in Hex for analyzing complex case data including events, financial transactions, and relationship networks. You'll leverage Hex's three AI agents:

| Agent | Purpose | Best For |
|-------|---------|----------|
| **Threads** | Conversational Q&A with your data | Quick insights, exploration, non-technical users |
| **Notebook Agent** | Code generation (SQL/Python) in notebooks | Building charts, transformations, deep analysis |
| **Modeling Agent** | Create semantic models | Defining reusable metrics, standardizing definitions |

---

## Recommended Data Schemas

Prepare your data in these CSV formats. Adjust column names and add/remove fields based on your actual data.

### 1. Events Timeline (`events.csv`)

Track key events, meetings, incidents, and milestones.

```csv
event_id,event_date,event_type,description,location,source,actors_involved,importance,verified
E001,1999-03-15,meeting,Private dinner at Manhattan residence,New York,Court Document,Jeffrey Epstein;Person A;Person B,high,true
E002,2000-07-22,travel,Flight to Caribbean island,US Virgin Islands,Flight Log,Jeffrey Epstein;Person C,high,true
E003,2001-11-08,financial,Large wire transfer to offshore account,Cayman Islands,Bank Records,Jeffrey Epstein,critical,true
E004,2002-05-30,legal,First civil lawsuit filed,Florida,Public Records,Victim 1,medium,true
```

**Column Definitions:**
- `event_id`: Unique identifier (string)
- `event_date`: ISO format date (YYYY-MM-DD)
- `event_type`: Category - meeting, travel, financial, legal, media, arrest, testimony
- `description`: Brief description of the event
- `location`: Geographic location
- `source`: Document or record source
- `actors_involved`: Semicolon-separated list of people involved
- `importance`: low, medium, high, critical
- `verified`: Boolean - whether independently verified

---

### 2. Financial Transactions (`transactions.csv`)

Track money flows, payments, and financial connections.

```csv
transaction_id,transaction_date,sender,sender_type,recipient,recipient_type,amount_usd,currency_original,transaction_type,account_origin,account_destination,purpose,source_document
T001,1998-06-12,Jeffrey Epstein,individual,Shell Company A,entity,500000,USD,wire_transfer,Chase NYC,Swiss Bank Zurich,Investment,Bank Statement
T002,1999-02-28,Foundation X,foundation,Jeffrey Epstein,individual,2000000,USD,donation,Unknown,JP Morgan NYC,Charitable contribution,Tax Filing
T003,2000-08-15,Jeffrey Epstein,individual,Person D,individual,150000,USD,payment,Deutsche Bank,Personal Account,Consulting fee,Court Exhibit
T004,2001-03-22,Corporation Y,corporation,Law Firm Z,entity,750000,USD,legal_fee,Corporate Account,Trust Account,Legal services,Invoice
```

**Column Definitions:**
- `transaction_id`: Unique identifier
- `transaction_date`: Date of transaction (YYYY-MM-DD)
- `sender` / `recipient`: Name of party
- `sender_type` / `recipient_type`: individual, entity, foundation, corporation, government
- `amount_usd`: Normalized USD amount
- `currency_original`: Original currency if different
- `transaction_type`: wire_transfer, cash, check, donation, payment, investment
- `account_origin` / `account_destination`: Bank/account identifiers
- `purpose`: Stated purpose of transaction
- `source_document`: Where this data came from

---

### 3. Actors & Relationships (`actors.csv`)

Define all people and entities in the investigation.

```csv
actor_id,actor_name,actor_type,role,organization,first_appearance_date,last_appearance_date,status,notes
A001,Jeffrey Epstein,individual,subject,Self-employed,1990-01-01,2019-08-10,deceased,Primary subject of investigation
A002,Person A,individual,associate,Company X,1995-03-15,2008-12-01,active,Business partner
A003,Person B,individual,victim,N/A,1999-06-01,2002-01-15,active,Testified in 2008 case
A004,Shell Company A,entity,financial_vehicle,N/A,1997-01-01,2010-06-30,dissolved,Offshore entity in Virgin Islands
A005,Foundation X,foundation,donor,N/A,1998-01-01,2019-08-10,active,Major philanthropic organization
```

**Column Definitions:**
- `actor_id`: Unique identifier
- `actor_name`: Full name or entity name
- `actor_type`: individual, entity, foundation, corporation, government_agency
- `role`: subject, associate, victim, witness, legal_counsel, financial_institution, media
- `organization`: Affiliated organization
- `first_appearance_date` / `last_appearance_date`: Date range in records
- `status`: active, deceased, dissolved, unknown
- `notes`: Additional context

---

### 4. Relationships Network (`relationships.csv`)

Define connections between actors.

```csv
relationship_id,actor_1_id,actor_1_name,actor_2_id,actor_2_name,relationship_type,relationship_strength,start_date,end_date,evidence_source,notes
R001,A001,Jeffrey Epstein,A002,Person A,business_partner,strong,1995-03-15,2008-12-01,Corporate Filings,Co-owned multiple properties
R002,A001,Jeffrey Epstein,A003,Person B,victim,N/A,1999-06-01,2002-01-15,Court Testimony,Recruited at age 16
R003,A001,Jeffrey Epstein,A004,Shell Company A,owner,strong,1997-01-01,2010-06-30,Panama Papers,100% beneficial ownership
R004,A002,Person A,A005,Foundation X,board_member,medium,2000-01-01,2015-12-31,Annual Report,Served on board of directors
```

**Column Definitions:**
- `relationship_id`: Unique identifier
- `actor_1_id` / `actor_2_id`: Foreign keys to actors table
- `actor_1_name` / `actor_2_name`: Names (for readability)
- `relationship_type`: business_partner, employer_employee, family, friend, victim, legal_counsel, financial, board_member, donor
- `relationship_strength`: weak, medium, strong (for network visualization)
- `start_date` / `end_date`: Duration of relationship
- `evidence_source`: Documentation
- `notes`: Additional context

---

## Step 1: Upload Your CSV Data

### Method A: Direct File Upload (Recommended for Hackathons)

1. **Create a new project**
   - Go to Hex homepage → Click **"New Project"**
   - Name it descriptively: `Investigation Dashboard - [Case Name]`

2. **Upload CSV files**
   - In the left sidebar, click the **"Files"** tab
   - Drag and drop your CSV files, or click **"Browse files"**
   - Upload all four CSV files: `events.csv`, `transactions.csv`, `actors.csv`, `relationships.csv`
   - Wait for upload confirmation (each file can be up to 2GB)

3. **Load CSVs into DataFrames**
   - Click the **three-dot menu** next to each uploaded file
   - Select **"Copy DataFrame creation code"**
   - Paste into a new Python cell:

```python
import pandas as pd

# Load all datasets
events_df = pd.read_csv('events.csv', parse_dates=['event_date'])
transactions_df = pd.read_csv('transactions.csv', parse_dates=['transaction_date'])
actors_df = pd.read_csv('actors.csv', parse_dates=['first_appearance_date', 'last_appearance_date'])
relationships_df = pd.read_csv('relationships.csv', parse_dates=['start_date', 'end_date'])

# Quick validation
print(f"Events: {len(events_df)} rows")
print(f"Transactions: {len(transactions_df)} rows")
print(f"Actors: {len(actors_df)} rows")
print(f"Relationships: {len(relationships_df)} rows")
```

4. **Run the cell** (Shift + Enter) to load your data

### Method B: Upload via Threads (Quick Exploration)

1. From Hex homepage, type a question in the **Threads prompt bar**
2. Click the **attachment icon** to upload a CSV directly
3. Ask: `"Summarize the key patterns in this data"`

> **Note:** Threads can join uploaded CSV data with existing warehouse data for cross-source insights.

---

## Step 2: Explore Data with AI Threads

Threads is perfect for initial exploration and quick questions. Use it before building your dashboard to understand your data.

### Getting Started with Threads

1. From **Hex homepage**, find the prompt bar at the top
2. Type natural language questions about your data
3. The AI will search for relevant data, write queries, and return visualizations

### Recommended Exploration Prompts

**For Events Data:**
```
What are the most common event types in my events data, and how are they distributed over time?
```

```
Show me a timeline of all critical and high importance events, grouped by location
```

```
Which actors appear most frequently across all events?
```

**For Financial Data:**
```
What is the total transaction volume by year? Show me a trend chart.
```

```
Who are the top 10 recipients of funds by total amount received?
```

```
Identify any transactions over $1 million and show the flow between sender and recipient
```

**For Relationship Analysis:**
```
Which actors have the most connections? Create a summary table.
```

```
Show me all relationships involving Jeffrey Epstein, categorized by relationship type
```

### Saving Thread Insights

When you find valuable insights:
1. Click **"Save as project"** to convert the Thread into a full notebook
2. The conversation history and generated code will be preserved
3. You can then refine and build upon it in the notebook

---

## Step 3: Build Analysis with Notebook Agent

The Notebook Agent helps you write SQL, Python, and create visualizations directly in your notebook.

### Activating the Notebook Agent

1. In any notebook, look for the **purple AI bar** at the top or press `Cmd/Ctrl + K`
2. Type your request in natural language
3. The agent will generate and optionally run cells

### Best Practices for Prompting

**Use structured prompts for complex tasks:**

```
Context: I'm analyzing investigation data with events, transactions, actors, and relationships tables.
Task: Create a timeline visualization showing all events color-coded by importance level.
Guidelines: Use plotly for interactivity, format dates nicely, add hover tooltips with event details.
```

**Reference specific dataframes with @ mentions:**

```
Using @events_df, create a bar chart showing the count of events by event_type, 
sorted from most to least common. Use a professional color scheme.
```

**Ask for a plan first on complex analyses:**

```
I need to build a network graph showing relationships between all actors. 
What Python libraries should I use, and what's the best approach? 
Outline a step-by-step plan before writing code.
```

### Recommended Analysis Cells to Create

**1. Event Timeline Visualization**
```
Create an interactive timeline using @events_df showing events on the y-axis 
(grouped by event_type) and dates on the x-axis. Color by importance level.
Make it zoomable and add tooltips showing the full event description.
```

**2. Financial Flow Analysis**
```
Using @transactions_df, create a Sankey diagram showing money flows 
from senders to recipients. Aggregate by sender and recipient, 
showing total USD amount. Only include flows over $100,000.
```

**3. Network Graph**
```
Build a network graph using @relationships_df and @actors_df.
Nodes should be actors, sized by their number of connections.
Edges should represent relationships, colored by relationship_type.
Use networkx and pyvis for interactive visualization.
```

**4. Summary Statistics Dashboard**
```
Create a summary section with key metrics:
- Total number of events, transactions, actors
- Date range of the investigation
- Total financial volume
- Most connected actor
Display these as single-value cards.
```

### Reviewing Agent Changes

- All agent changes appear in a **diff view**
- Review the code before accepting
- Click **"Keep"** to accept or **"Undo"** to reject
- You can edit the code directly in the diff view before accepting

---

## Step 4: Create Semantic Models (Optional Advanced)

Semantic models standardize how metrics are calculated, ensuring consistency. This is valuable if multiple people will query your data.

### What Are Semantic Models?

- Pre-defined measures (e.g., "Total Transaction Volume")
- Standardized dimensions (e.g., "Event Year", "Actor Type")
- Join logic between tables

### Using the Modeling Agent

> **Note:** Requires Admin role on Team/Enterprise plans

1. Go to **Settings → Semantic Models** or use the Modeling Workbench
2. Use the Modeling Agent to generate definitions:

```
Create a semantic model for my investigation data with:
- A transactions model with measures for total_amount, average_amount, transaction_count
- Dimensions for transaction_type, sender_type, recipient_type, year, month
- A relationship to the actors model on sender and recipient
```

### Example Semantic Model (YAML)

```yaml
id: transactions
type: model
base_sql_table: transactions_df
dimensions:
  - id: transaction_type
    type: string
  - id: sender_type
    type: string
  - id: transaction_year
    type: number
    expr_sql: EXTRACT(YEAR FROM transaction_date)
measures:
  - id: total_volume
    name: Total Transaction Volume
    func: sum
    of: amount_usd
  - id: transaction_count
    func: count
  - id: average_transaction
    func: avg
    of: amount_usd
```

Once defined, these measures can be used in Explore cells and referenced by AI agents for consistent answers.

---

## Step 5: Design Your Dashboard

### Creating the App Layout

1. Switch from **Notebook view** to **App view** (toggle in top-right)
2. Drag cells from your notebook into the app canvas
3. Use the **Layout panel** to arrange components in rows and columns

### Dashboard Component Recommendations

| Component | Cell Type | Purpose |
|-----------|-----------|---------|
| Key Metrics | Single Value / Markdown | Show totals at a glance |
| Timeline | Chart (Line/Scatter) | Event progression over time |
| Financial Flows | Chart (Sankey/Bar) | Money movement patterns |
| Network Graph | Python + HTML | Relationship visualization |
| Actor Table | Table with filters | Searchable directory |
| Filters | Input cells (Dropdown, Date Range) | Interactive filtering |

### Adding Interactivity with Input Cells

**Date Range Filter:**
1. Add a **Date Range input** cell
2. Name the variable: `date_filter`
3. Reference in downstream cells:

```python
filtered_events = events_df[
    (events_df['event_date'] >= date_filter[0]) &
    (events_df['event_date'] <= date_filter[1])
]
```

**Actor Type Filter:**
```python
# Create a multiselect input cell named 'selected_actor_types'
# Then filter:
filtered_actors = actors_df[actors_df['actor_type'].isin(selected_actor_types)]
```

**Importance Level Filter:**
```python
# Create a dropdown input named 'importance_filter' with options: All, critical, high, medium, low
if importance_filter != 'All':
    filtered_events = events_df[events_df['importance'] == importance_filter]
else:
    filtered_events = events_df
```

---

## Dashboard Layout Recommendations

### Suggested Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVESTIGATION DASHBOARD                       │
│                    [Case Name] Analysis                          │
├─────────────────────────────────────────────────────────────────┤
│ [Date Filter]     [Actor Filter]     [Event Type Filter]        │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  Total Events │  Total Trans  │  Total Actors │  Total Volume   │
│     ###       │     ###       │     ###       │    $###,###     │
├───────────────┴───────────────┴───────────────┴─────────────────┤
│                                                                  │
│              EVENT TIMELINE (Full Width)                         │
│              [Interactive scatter/line chart]                    │
│                                                                  │
├─────────────────────────────────┬────────────────────────────────┤
│                                 │                                │
│   FINANCIAL FLOWS               │    RELATIONSHIP NETWORK        │
│   [Sankey or stacked bar]       │    [Interactive network]       │
│                                 │                                │
├─────────────────────────────────┴────────────────────────────────┤
│                                                                  │
│              TOP ACTORS TABLE (Sortable, Searchable)             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│              TRANSACTION DETAIL TABLE (Filtered)                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Visual Design Tips

1. **Color Coding Consistency**
   - Use consistent colors for importance: critical=red, high=orange, medium=yellow, low=green
   - Use consistent colors for relationship types across all visualizations

2. **White Space**
   - Don't overcrowd - use padding between sections
   - Group related elements together

3. **Title Every Section**
   - Use Markdown cells for section headers
   - Add brief explanations of what each visualization shows

4. **Mobile Consideration**
   - Test in narrow browser windows
   - Stack elements vertically for responsive design

---

## Effective Prompts for Hex AI

### Timeline Analysis
```
Create a comprehensive timeline visualization showing:
- X-axis: event_date
- Y-axis: actor groups (group events by the first actor in actors_involved)
- Color: event_type
- Size: based on importance (critical=largest)
- Tooltips: show description, location, source
Make it interactive with zoom and pan. Use plotly.
```

### Financial Network
```
Build a network visualization of financial flows:
1. Parse @transactions_df to extract unique senders and recipients
2. Create nodes for each, sized by total transaction volume
3. Create edges weighted by transaction amounts
4. Color nodes by type (individual=blue, entity=green, foundation=purple)
5. Use pyvis for interactive HTML output
```

### Relationship Strength Analysis
```
Analyze @relationships_df to find:
1. The most connected actors (degree centrality)
2. Bridge actors connecting different groups (betweenness centrality)
3. Clusters of closely connected actors
Create a summary table and highlight the top 10 most influential actors.
```

### Cross-Table Analysis
```
Join @events_df with @actors_df to answer:
Which actors were involved in the most high-importance events?
Create a ranked table showing actor_name, role, and count of high/critical events.
```

---

## Publishing and Sharing

### Publish Your App

1. Click **"Publish"** button in top-right
2. Choose visibility:
   - **Workspace**: Anyone in your Hex workspace
   - **Public**: Shareable link (be careful with sensitive data)
3. Configure run settings:
   - **On view**: App runs when opened (live data)
   - **Cached**: Shows last saved results (faster loading)

### Sharing Options

- **Direct Link**: Copy the published app URL
- **Embed**: Use signed embedding API for external websites
- **Slack**: Share via Hex's Slack integration

### Export Options

- **Download as PDF**: For presentations
- **Export project as YAML**: For version control / backup
- **Git Export**: Connect to GitHub/GitLab (Team/Enterprise)

---

## Quick Reference: Hex AI Commands

| Task | Where | Example Prompt |
|------|-------|----------------|
| Quick data question | Threads | "What's the average transaction amount by year?" |
| Create a chart | Notebook Agent | "Create a bar chart of events by type using @events_df" |
| Write SQL | Notebook Agent | "Write a SQL query to find all transactions over $1M" |
| Debug code | Notebook Agent | "Fix the error in @cell_name" (or click "Fix with agent") |
| Explain code | Notebook Agent | "Explain what this cell does in plain language" |
| Build semantic model | Modeling Agent | "Create a model for transactions with sum, count, and avg measures" |
| Get suggestions | Notebook Agent | "What are 3 ways I could visualize relationship networks?" |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CSV won't upload | Check file size (<2GB), ensure valid CSV format |
| Date parsing errors | Verify date format is YYYY-MM-DD, use `parse_dates` in pd.read_csv |
| Agent not finding data | Use @ mentions to explicitly reference dataframes |
| Visualization too slow | Sample data first: `df.sample(1000)` for testing |
| Network graph crashes | Limit nodes: filter to most connected actors first |

---

## Next Steps for Your Hackathon

1. ✅ Prepare your CSV files using the schemas above
2. ✅ Upload to Hex and validate data loads correctly
3. ✅ Use Threads for initial exploration
4. ✅ Build key visualizations with Notebook Agent
5. ✅ Design dashboard layout in App view
6. ✅ Add filters for interactivity
7. ✅ Publish and share!

**Good luck with your hackathon! 🚀**

---

*Guide created for Hex Platform - Last updated December 2024*