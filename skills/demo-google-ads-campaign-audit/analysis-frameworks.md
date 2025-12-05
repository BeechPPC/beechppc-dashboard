# Google Ads Campaign Audit - Analysis Frameworks

This reference file contains analysis methods, common structural and budget issues, standard recommendations, and output templates for Google Ads campaign audits.

**Referenced from:** SKILL.md
**Usage:** Read this file when you need guidance on identifying structural inefficiencies and budget misallocations.

**Scope:** This file focuses exclusively on **structure** and **budget** issues. Performance optimization, ad copy quality, and keyword analysis are separate audits.

---

## Table of Contents

1. Critical Analysis Methods
2. Common Structural & Budget Issues
3. Standard Recommendations
4. Output Format Templates
5. Best Practices from Expert Frameworks

---

## Critical Analysis Methods

### 1. Account Structure Evaluation

**Check for structural issues:**

**Network Mixing (CRITICAL ERROR):**
- Search and Display should NEVER be in same campaign
- Different networks require completely different strategies and creative
- Performance Max should be separate from Search campaigns

**Brand/Non-Brand Mixing (HIGH PRIORITY):**
- Brand and non-brand keywords in same campaigns creates self-competition
- Inflates CPCs through internal auction conflicts
- Prevents granular bid control and budget allocation

**Over-Segmentation:**
- Too many campaigns spreads data too thin
- Prevents statistical significance for automated bidding (needs 30-50 conversions/month)
- Example: 50 campaigns each spending $100/month instead of 5 campaigns at $1,000/month

**Under-Segmentation:**
- Everything in one campaign prevents granular control
- Can't optimize bids, budgets, or targeting by segment
- Example: All products in one campaign when they have different margins/values

**Naming Conventions:**
- Inconsistent or missing naming conventions make reporting impossible
- Standard pattern: [Type]_[Goal]_[Target]_[Geo]
- Example: SEARCH_Brand_tROAS_5x_UK

### 2. Campaign Settings Audit

**Location Targeting Validation:**

**Advanced Location Settings (CRITICAL):**
- "People in your targeted locations" = Physical presence or regular presence (CORRECT)
- "People interested in your targeted locations" = Also includes people searching ABOUT your location (WASTE)
- **Most accounts should use "People in" only** to prevent geographic waste
- Example: Pool supply store in Sydney shows ads to someone in London searching "pool supplies Sydney"

**Common location issues:**
- Serving ads outside service area
- Wrong countries included (check GA4 traffic data)
- Missing negative locations (competitors, irrelevant cities)
- Location radius too broad for local businesses

**Network Settings Review:**

**Search Partners Performance:**
- Often drives 20-40% lower quality traffic than Google Search
- Should be monitored separately for 30 days
- **Disable if underperforming by 20%+ in CPA or ROAS**
- Can account for 15-30% of Search campaign spend

**Display Network (if enabled in Search campaigns):**
- RED FLAG if Display enabled in Search campaign
- Requires completely different creative and bidding
- Should be separate campaigns

### 3. Budget Allocation Analysis

**Budget Performance Indicators:**

**Lost Impression Share (Budget):**
- >10% = Campaign is budget-constrained, missing traffic
- >20% = Significantly constrained, immediate action needed
- >50% = Severely constrained, major opportunity
- 0-10% = Budget is sufficient for current bids

**Lost Impression Share (Rank):**
- Indicates bids too low or Quality Score too low
- Can't fix with budget increases, needs bid or quality improvements
- Consider if target CPA/ROAS is too aggressive
- High Lost IS (Rank) with high budget = bid strategy problem, not budget problem

**Budget Utilization:**
- 100% daily spend = Likely hitting limits, missing traffic
- <60% utilization = Over-budgeted or targeting too narrow
- Fluctuating 50-100% = Normal for most campaigns

**The 80/20 Rule (Mike Rhodes):**
Review which campaigns drive 80% of results:
- Top 20% of campaigns typically generate 80% of conversions
- Ensure budget allocation matches performance contribution
- Calculate: Does spend distribution match conversion distribution?

**Reallocation scenarios:**
1. High-performer hitting budget limits → Increase budget 15-20%
2. Low-performer with Lost IS (Rank) → Don't increase budget, improve bids/quality
3. Under-spending campaign → Reduce budget, reallocate to constrained campaigns
4. Equal budget across unequal performers → Shift from low ROAS to high ROAS

### 4. Bidding Strategy Evaluation

**Strategy Appropriateness Matrix:**

| Goal | Conversion Data | Recommended Strategy |
|------|----------------|---------------------|
| Brand awareness | Any | Maximize Clicks or Target Impression Share |
| Traffic | Any | Maximize Clicks |
| Conversions (volume) | <30/month | Manual CPC or Enhanced CPC |
| Conversions (volume) | 30-50/month | Target CPA or Maximize Conversions |
| Conversions (volume) | 50+/month | Maximize Conversions |
| Conversions (value) | 50+/month | Target ROAS or Maximize Conversion Value |
| Specific CPA target | 30+/month | Target CPA |
| Specific ROAS target | 50+/month | Target ROAS |

**Common bidding issues:**

**Wrong Strategy for Goals:**
- Using Maximize Clicks when goal is conversions (wastes budget on clicks)
- Using Target CPA without sufficient conversion data (<30/month)
- Using Target ROAS on campaigns with no conversion value tracking

**Automated Bidding Without Data:**
- Smart Bidding requires 30+ conversions/month minimum
- Target CPA/ROAS needs 30-50 conversions for learning
- Using Maximize Conversions on new accounts fails without conversion history

**Target Misalignment:**
- Target CPA set too low (below actual CPA by 30%+) prevents algorithm from finding traffic
- Target ROAS too aggressive (2x current ROAS) causes under-delivery
- Targets should be within 10-15% of actual performance after learning period

**Learning Periods:**
- 4-6 weeks typical for bid strategy learning
- Avoid changes during learning (resets progress)
- Check performance trends before deeming strategy "failed"

---

## Common Structural & Budget Issues

### CRITICAL Issues (RED)
1. **Search and Display mixed in same campaigns**
2. **No logical campaign structure or naming conventions**
3. **Advanced location settings using "People interested in" wasting geography**
4. **100% reliance on automation without conversion data** (Maximize Conversions with <30 conversions/month)
5. **Budget capping high-performers** while over-funding poor performers

### HIGH-Priority Issues (AMBER)
1. **Brand and non-brand keywords in same campaigns**
2. **Search Partners enabled without monitoring** (potentially 20-40% lower quality)
3. **Wrong bid strategy for goals** (Maximize Clicks for conversion goals)
4. **Over-segmentation** spreading data too thin for automated bidding
5. **Aggressive target CPA/ROAS** too low for algorithm to find traffic

### MEDIUM-Priority Issues (YELLOW)
1. **No bid strategy testing** (never experiment with new approaches)
2. **Budget allocation not aligned with performance** (equal budgets for unequal performers)
3. **Under-segmentation** preventing granular control

---

## Standard Recommendations

### For Account Structure
1. **Implement clear naming conventions:** [Type]_[Goal]_[Target]_[Geo]
2. **Separate brand from non-brand campaigns** to prevent cannibalization
3. **Split Search and Display** into completely separate campaigns
4. **Segment by business objective:** Brand, non-brand, competitors, products/services
5. **Consolidate over-segmented campaigns** that have <30 conversions/month

### For Campaign Settings
1. **Use "People in your targeted locations"** not "People interested in"
2. **Monitor Search Partners separately** for 30 days, disable if underperforming by 20%+
3. **Verify location radius settings** for local businesses (not 100+ miles)
4. **Add irrelevant countries to exclusions** after auditing GA4 traffic
5. **Exclude company IP addresses** and competitor locations where relevant

### For Budget Allocation
1. **Allocate 60-70% to proven high-performers** with consistent ROAS
2. **Reserve 20-30% for testing** new campaigns, keywords, audiences
3. **Increase budgets gradually** (15-20% max every 3-4 days to avoid learning disruption)
4. **Check Lost IS (Budget) monthly** to identify scale opportunities
5. **Redistribute from Lost IS (Rank) campaigns** to Lost IS (Budget) campaigns

### For Bidding Strategies
1. **New accounts: Start with Manual CPC or Enhanced CPC** for first 30-60 days
2. **30+ conversions/month: Move to Target CPA or Target ROAS**
3. **50+ conversions/month: Test Maximize Conversions or Maximize Conversion Value**
4. **Run 50/50 experiments** for 30 days minimum when testing new strategies
5. **Allow 4-6 weeks for learning periods** without further modifications

---

## Output Format Templates

Present findings in this structure:

### Executive Summary

**Overall Health:** [RED/AMBER/GREEN]

**Account Classification:** [SMALL/MEDIUM/LARGE]

**Campaigns Analyzed:** [X of Y campaigns, representing Z% of spend]

**Top Finding:** [Most critical structural or budget issue]

**Primary Recommendation:** [Highest-impact action with quantified benefit]

---

### Phase 1: Account Intelligence

**Account Scale:**
- Total campaigns: [count]
- Enabled campaigns: [count]
- Paused campaigns: [count]
- Classification: [SMALL/MEDIUM/LARGE]

**Spend Concentration:**
| Rank | Campaign | Spend (30d) | % of Total |
|------|----------|-------------|------------|
| 1 | [Name] | $X,XXX | XX% |
| ... | ... | ... | ... |

**80/20 Analysis:**
- Top 20% of campaigns: $XXX (XX% of total spend)
- Audit focus: Top X campaigns representing XX% of spend

---

### Phase 2: Structural Issues

**Geographic Targeting Problems:**

[List campaigns using PRESENCE_OR_INTEREST with spend impact]

Example:
- 5 campaigns using "People interested in" targeting
- Total spend affected: $45,000/month
- Estimated waste: 10-15% = $4,500-6,750/month

**Network Settings Issues:**

[List campaigns with Search Partners enabled inappropriately]

Example:
- 3 campaigns have Search Partners enabled
- Combined spend: $120,000/month on Search Partners
- Search Partners CPA: $85 vs Google Search CPA: $52 (+63% higher)
- Recommendation: Disable Search Partners, save $40,000/month or reallocate

**Bid Strategy Mismatches:**

[List campaigns using automated bidding without sufficient conversion volume]

Example:
- 4 campaigns using Target ROAS with <30 conversions/month
- Insufficient data for algorithm to learn effectively
- Recommendation: Switch to Maximize Conversions or consolidate campaigns

**Naming Convention Issues:**

[Assess consistency: Consistent / Inconsistent / Non-existent]

Example:
- No consistent naming pattern across 45 campaigns
- Makes reporting and management difficult at scale
- Recommendation: Implement [TYPE]_[GOAL]_[TARGET]_[GEO] standard

---

### Phase 3: Budget Allocation Issues

**Budget-Constrained Campaigns:**

| Campaign | Budget/day | Spend (7d) | Lost IS (Budget) | Lost IS (Rank) | Assessment |
|----------|------------|------------|------------------|----------------|------------|
| [Name] | $XXX | $XXX | XX% | XX% | 🔴 Severely constrained |
| ... | ... | ... | ... | ... | ... |

**Quantified Opportunities:**
- 3 campaigns losing >20% IS to budget
- Current spend: $50,000/month
- Opportunity: +$12,500/month revenue at current ROAS if budget increased

**Budget Misallocation:**

[High-spend, low-ROAS campaigns that should have budget reduced]

Example:
| Campaign | Spend (30d) | ROAS | vs Account Avg | Action |
|----------|-------------|------|----------------|--------|
| Campaign A | $15,000 | 2.1x | -50% | Reduce budget |
| Campaign B | $8,000 | 1.5x | -65% | Pause or restructure |

**Reallocation Scenario:**
- Move $10k/month from low-ROAS campaigns (2.1x) to constrained high-ROAS campaigns (5.2x)
- Expected impact: +$26k/month revenue

---

### Phase 4: Optional Segmentation Findings

**[Only include sections below if Phase 3 queries were executed]**

**Device Performance Issues:**

[If device-performance query was run]

Example:
- Mobile CPA: $145 (+28% vs account average)
- Desktop CPA: $98 (-12% vs account average)
- Recommendation: Decrease mobile bids by 20% on 5 high-spend campaigns

**Geographic Performance Issues:**

[If geographic-performance query was run]

Example:
- London: $25k spend, 2.8x ROAS
- Manchester: $8k spend, 4.5x ROAS (+61% vs London)
- Recommendation: Increase Manchester bids by 30%, create separate Manchester campaign

**Network Performance Issues:**

[If network-performance query was run]

Example:
- Google Search: 75% of spend, 4.2x ROAS
- Search Partners: 25% of spend, 2.3x ROAS (-45% vs Google)
- Recommendation: Disable Search Partners on all campaigns, reallocate $30k/month

---

### Recommendations (Prioritized by ICE Framework)

**CRITICAL (Do Immediately):**
1. **Fix geographic targeting on 5 campaigns** - Change PRESENCE_OR_INTEREST to PRESENCE on campaigns spending $45k/month. Expected impact: 10-15% waste reduction = $4.5-6.7k/month saved.
2. **Increase budget on 3 constrained campaigns** - Currently losing 25% impression share to budget. Expected impact: +$15k/month revenue at current ROAS.

**HIGH (Do Within 1 Week):**
1. **Disable Search Partners on 4 campaigns** - Currently spending $12k/month on Search Partners with 2.1x ROAS vs 4.5x on Google Search. Expected impact: $6k/month saved or reallocated.
2. **Consolidate 8 low-spend campaigns** - Each spending <$500/month, preventing automated bidding from learning. Expected impact: Better performance through consolidation.

**MEDIUM (Do Within 1 Month):**
1. **Implement naming conventions** - Inconsistent naming makes reporting difficult. Propose standard: [CHANNEL]_[TYPE]_[BID STRATEGY]_[TARGET]
2. **Review bid strategies on 4 campaigns** - Using Target ROAS with <30 conversions/month. Expected impact: More consistent performance.

---

## Best Practices from Expert Frameworks

**Mike Rhodes (80/20 Rule):**
- "Focus on the 20% of campaigns driving 80% of results"
- "A 10% improvement on $50,000/month campaign delivers $5,000 monthly savings vs $100 from a $1,000/month campaign"

**Frederick Vallaeys (ICE Framework):**
- "Prioritize by Impact × Confidence × Ease score"
- Impact: How much $ or % improvement will this deliver?
- Confidence: How certain are we this will work?
- Ease: How quickly can this be implemented?

**Brad Geddes:**
- "Follow the Money: Start audits with highest spend areas"
- "Fix structural issues before optimizing tactics"

**Navah Hopkins:**
- "Campaign structure determines your ability to optimize at scale"
- "Budget constraints and wrong bid strategies waste 50%+ of spend"

---

## Remember

**Campaign audits focus on structural inefficiencies and budget misallocations.**

Your job is NOT to optimize performance - it's to identify the **structural and budgetary issues** that prevent optimization from being possible.

**Core focus areas:**
1. Geographic targeting waste (PRESENCE_OR_INTEREST)
2. Network settings issues (Search Partners, Display mixing)
3. Bid strategy mismatches (automated bidding without conversion volume)
4. Budget constraints (Lost IS Budget >10%)
5. Budget misallocation (high spend on low ROAS)

**Always quantify impact:**
- Every issue should have $ or % impact
- Example: "5 campaigns with PRESENCE_OR_INTEREST, spending $45k/month, estimated 10-15% waste = $4.5-6.7k/month"

**Prioritize ruthlessly using ICE framework:**
- CRITICAL = High impact + Easy to fix
- HIGH = High impact + Moderate effort
- MEDIUM = Important but complex or lower impact
