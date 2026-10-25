import path from "path"
import { Project, Type } from "ts-morph"

const root = path.resolve(__dirname, "../..")
const project = new Project({ tsConfigFilePath: path.join(root, "tsconfig.json") })
const file = project.getSourceFileOrThrow(path.join(root, "managers/ConfigManager.ts"))
const configType = file.getTypeAliasOrThrow("Config").getType()

function toSchema(type: Type): object | null {
  if (type.isString()) return { type: "string" }
  if (type.isNumber()) return { type: "number" }
  if (type.isBoolean()) return { type: "boolean" }
  if (type.isStringLiteral()) return { const: type.getLiteralValue() }
  if (type.isArray()) {
    const el = toSchema(type.getArrayElementTypeOrThrow())
    if (!el) return null
    return { type: "array", items: el }
  }
  if (type.isUnion()) {
    const schemas = type.getUnionTypes().flatMap(t => {
      const s = toSchema(t)
      return s ? [s] : []
    })
    return schemas.length === 1 ? schemas[0] : { anyOf: schemas }
  }
  if (type.isObject()) {
    const props: Record<string, object> = {}
    const required: string[] = []
    for (const prop of type.getProperties()) {
      const pt = prop.getTypeAtLocation(file)
      if (pt.getCallSignatures().length > 0) continue
      const s = toSchema(pt)
      if (!s) continue
      props[prop.getName()] = s
      if (!prop.isOptional()) required.push(prop.getName())
    }
    const result: any = { type: "object", properties: props, additionalProperties: false }
    return result
  }
  return null
}

console.log(JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", ...toSchema(configType) }, null, 2))
