import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { COMMITTED_CHAT_API_ORIGIN } from "./workflow-chat-api.mjs";

// Import points the research tools at whatever CHAT_PORT is set to locally.
// Export is the other half of that round trip: put the repository default back
// so a re-export never commits one machine's port number.
const localChatApiOrigin = /http:\/\/127\.0\.0\.1:\d+(?=\/api\/)/g;

const exportDirectory = process.argv[2];
const canonicalDirectory = process.argv[3];

if (!exportDirectory || !canonicalDirectory) {
  throw new Error(
    "Usage: node scripts/normalise-workflow-exports.mjs EXPORT_DIR CANONICAL_DIR",
  );
}

const resolvedExportDirectory = resolve(exportDirectory);
const resolvedCanonicalDirectory = resolve(canonicalDirectory);
const exportFiles = (await readdir(resolvedExportDirectory))
  .filter((file) => file.endsWith(".json"))
  .sort();

if (exportFiles.length === 0) {
  throw new Error("No workflow JSON files were found in the export directory");
}

for (const file of exportFiles) {
  const exportPath = join(resolvedExportDirectory, file);
  const canonicalPath = join(resolvedCanonicalDirectory, file);
  const rawExport = JSON.parse(await readFile(exportPath, "utf8"));
  const workflow = Array.isArray(rawExport) ? rawExport[0] : rawExport;
  const canonical = JSON.parse(await readFile(canonicalPath, "utf8"));

  if (
    (Array.isArray(rawExport) && rawExport.length !== 1) ||
    !workflow ||
    typeof workflow !== "object"
  ) {
    throw new Error(`${file}: expected exactly one exported workflow`);
  }
  if (workflow.id !== canonical.id) {
    throw new Error(
      `${file}: workflow ID "${workflow.id}" does not match canonical "${canonical.id}"`,
    );
  }
  if (!Array.isArray(workflow.nodes) || !workflow.connections) {
    throw new Error(`${file}: exported workflow is missing nodes or connections`);
  }

  const canonicalNodes = new Map(
    canonical.nodes.map((node) => [node.id, node]),
  );
  const normalisedNodes = workflow.nodes.map((node) => {
    const canonicalNode = canonicalNodes.get(node.id);
    const exportedCredentialCount = Object.keys(node.credentials ?? {}).length;
    const canonicalCredentialCount = Object.keys(
      canonicalNode?.credentials ?? {},
    ).length;
    if (exportedCredentialCount > 0 && canonicalCredentialCount === 0) {
      throw new Error(
        `${file}: new credential-bearing node "${node.name}" needs manual security review`,
      );
    }
    if (canonicalCredentialCount > 0) {
      return { ...node, credentials: canonicalNode.credentials };
    }
    return node;
  });

  const normalised = {
    name: workflow.name,
    nodes: normalisedNodes,
    pinData: workflow.pinData ?? {},
    connections: workflow.connections,
    active: false,
    settings: workflow.settings ?? canonical.settings,
    versionId: workflow.versionId,
    meta: canonical.meta,
    id: workflow.id,
    tags: canonical.tags ?? [],
  };

  const serialised = JSON.stringify(normalised, null, 2).replace(
    localChatApiOrigin,
    COMMITTED_CHAT_API_ORIGIN,
  );
  await writeFile(exportPath, `${serialised}\n`);
}

console.log(`Normalised ${exportFiles.length} workflow exports for review.`);
