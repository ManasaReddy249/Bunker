// Sample nautical-mile values for DEMO MODE only. Not calculated, not from SQL.
const SAMPLE_NM_BY_PORT = {
  Singapore: 12,
  Colombo: 20,
  Dubai: 15,
  Mumbai: 18,
  Jakarta: 25,
  Fujairah: 10,
  Chennai: 14,
  Shanghai: 22,
  Rotterdam: 16,
  'Hong Kong': 19,
  'Port Klang': 11,
  Mundra: 13
};

function sampleNm(port) {
  if (!port) return null;
  return SAMPLE_NM_BY_PORT[port] ?? 16;
}

module.exports = { SAMPLE_NM_BY_PORT, sampleNm };
