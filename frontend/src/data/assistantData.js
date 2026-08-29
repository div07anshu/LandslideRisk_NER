import { AREAS } from "./analysisData";

export const WELCOME_MESSAGE =
  "Hi, I'm your Landslide Risk Assistant for the North East Region. Ask me about risk scores, contributing factors, alerts, or safety steps.";

export const SUGGESTED_PROMPTS = [
  "What's the risk in Kohima Ridge?",
  "What raises landslide risk?",
  "What should I do during a high alert?",
  "How is the risk score calculated?",
];

const SAFETY_TIPS = [
  "Move away from steep slopes and low-lying areas if you notice cracks, tilting trees, or sudden water changes.",
  "Keep emergency contacts and a go-bag ready during heavy rainfall periods.",
  "Report visible cracks, soil movement or debris flow immediately through the Reports page.",
  "Avoid unnecessary travel through mountain roads during continuous heavy rainfall.",
];

function findArea(text) {
  const q = text.toLowerCase();
  return AREAS.find(
    (a) =>
      q.includes(a.name.toLowerCase()) ||
      q.includes(a.state.toLowerCase()) ||
      q.includes(a.id),
  );
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function trendWord(trend) {
  if (trend === "up") return "rising";
  if (trend === "down") return "falling";
  return "stable";
}

export function getMockResponse(text) {
  const q = text.toLowerCase();

  const area = findArea(text);
  if (area) {
    const top = [...area.factors].sort((a, b) => b.value - a.value)[0];
    return `${area.name}, ${area.state} currently has a composite risk score of ${area.riskScore}/100 (${area.riskLevel} risk). The leading contributing factor is ${top.label.toLowerCase()} at ${top.value}/100. The trend over the last month is ${trendWord(
      area.trend,
    )}.`;
  }

  if (
    q.includes("safety") ||
    q.includes("what should i do") ||
    q.includes("alert")
  ) {
    return pick(SAFETY_TIPS);
  }

  if (q.includes("factor") || q.includes("cause") || q.includes("why")) {
    return "Risk scores are driven mainly by rainfall intensity, slope gradient, soil saturation, seismic activity, vegetation cover and past incident history. Rainfall and soil saturation tend to move fastest during monsoon.";
  }

  if (q.includes("score") || q.includes("calculat")) {
    return "The composite risk score blends six weighted factors — rainfall, slope, soil saturation, seismic activity, vegetation cover and historical incidents — into a single 0-100 score. Above 70 is treated as high risk.";
  }

  if (q.includes("report")) {
    return "You can file a field report from the Reports page with a title, location, category and description — it shows up as Pending until a team investigates.";
  }

  if (q.includes("hello") || q.startsWith("hi") || q.includes(" hi ")) {
    return "Hello! I can help with risk scores, contributing factors, alerts and safety guidance across the North East Region. What would you like to know?";
  }

  return "I don't have specific data on that yet, but I can help with risk scores, contributing factors, recent alerts, or safety guidance for monitored areas across the North East Region.";
}
