type JsonType = 'object' | 'string' | 'integer' | 'boolean' | 'array' | 'null';

/** Un esquema JSON mínimo: lo que usan las entradas y salidas de las herramientas. */
export type JsonSchema = {
  type: JsonType | JsonType[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
};

export type UtcpAuth = {
  auth_type: 'api_key';
  api_key: string;
  var_name: string;
  location: 'header';
};

export type UtcpHttpCallTemplate = {
  call_template_type: 'http';
  url: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  content_type?: string;
  body_field?: string;
  auth?: UtcpAuth;
};

export type UtcpTool = {
  name: string;
  description: string;
  inputs: JsonSchema;
  outputs: JsonSchema;
  tags: string[];
  tool_call_template: UtcpHttpCallTemplate;
};

export type UtcpManual = {
  utcp_version: string;
  manual_version: string;
  info: { title: string; version: string; description: string };
  tools: UtcpTool[];
};
