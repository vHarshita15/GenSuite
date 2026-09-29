import opportunityData from "../data/opportunities.js";

export const getOpportunities = (req, res) => {
  const category = String(req.query.category || "").trim().toLowerCase();
  const query = String(req.query.q || "").trim().toLowerCase();

  const opportunities = opportunityData.filter((opportunity) => {
    const matchesCategory = !category || opportunity.category.toLowerCase() === category;
    const searchableText = [opportunity.title, opportunity.organization, opportunity.description]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    return matchesCategory && matchesQuery;
  });

  return res.json({ success: true, opportunities });
};
