import { Range, TextDocument } from "vscode";
import {
	Kind,
	load,
	YamlMap,
	YAMLMapping,
	YAMLNode,
	YAMLScalar,
	YAMLSequence,
} from "yaml-ast-parser";
import { matchFromRegexp, Parser, suggestionFromKey } from ".";
import { REGEXP } from "../../constants";

export const createRange = (document: TextDocument, node: YAMLScalar): Range =>
	new Range(
		document.positionAt(node.startPosition),
		document.positionAt(node.endPosition),
	);

export default class YamlParser extends Parser {
	public constructor(document: TextDocument) {
		super(document);
	}

	protected parse() {
		const astData = load(this.document.getText());
		this.parseNode(astData);
	}

	private parseNode(node: YAMLNode) {
		switch (node.kind) {
			case Kind.MAP:
				this.parseMapNode(node as YamlMap);
				break;
			case Kind.SEQ:
				this.parseSequenceNode(node as YAMLSequence);
				break;
			case Kind.SCALAR:
				this.parseScalarNode(node as YAMLScalar);
				break;
		}
	}

	private parseMappingNode(node: YAMLMapping) {
		switch (node.value.kind) {
			case Kind.MAP:
				this.parseMapNode(node.value as YamlMap);
				break;
			case Kind.SEQ:
				this.parseSequenceNode(node.value as YAMLSequence);
				break;
			case Kind.SCALAR:
				this.parseScalarNode(node.value as YAMLScalar, node.key);
				break;
		}
	}

	private parseMapNode(node: YamlMap) {
		for (const mapping of node.mappings) {
			this.parseMappingNode(mapping);
		}
	}

	private parseSequenceNode(node: YAMLSequence) {
		for (const item of node.items) {
			this.parseNode(item);
		}
	}

	private parseScalarNode(valueNode: YAMLScalar, keyNode?: YAMLScalar) {
		const fieldValue = valueNode.value;

		if (typeof fieldValue !== "string") {
			return;
		}

		const range = createRange(this.document, valueNode);
		let suggestion = matchFromRegexp(fieldValue)?.suggestion;

		if (!suggestion && keyNode && !REGEXP.SECRET_REFERENCE.test(fieldValue)) {
			suggestion = suggestionFromKey(keyNode.value);
		}

		if (suggestion) {
			this.matches.push({
				range,
				fieldValue,
				suggestion,
			});
		}
	}
}
