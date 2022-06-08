import parser, {
	ArrayNode,
	IdentifierNode,
	LiteralNode,
	ObjectNode,
	PropertyNode,
	ValueNode,
} from "json-to-ast";
import { Position, Range, TextDocument } from "vscode";
import { matchFromRegexp, Parser, suggestionFromKey } from ".";
import { REGEXP } from "../../constants";

export const createRange = (node: LiteralNode): Range =>
	new Range(
		new Position(node.loc.start.line - 1, node.loc.start.column),
		new Position(node.loc.end.line - 1, node.loc.end.column - 2),
	);

export default class JsonParser extends Parser {
	public constructor(document: TextDocument) {
		super(document);
	}

	protected parse() {
		const astData = parser(this.document.getText());
		this.parseValueNode(astData);
	}

	private parseValueNode(node: ValueNode) {
		switch (node.type) {
			case "Object":
				this.parseObjectNode(node);
				break;
			case "Array":
				this.parseArrayNode(node);
				break;
			case "Literal":
				this.parseLiteralNode(node);
				break;
		}
	}

	private parsePropertyNode(node: PropertyNode) {
		switch (node.value.type) {
			case "Object":
				this.parseObjectNode(node.value);
				break;
			case "Array":
				this.parseArrayNode(node.value);
				break;
			case "Literal":
				this.parseLiteralNode(node.value, node.key);
				break;
		}
	}

	private parseObjectNode(node: ObjectNode) {
		for (const child of node.children) {
			this.parsePropertyNode(child);
		}
	}

	private parseArrayNode(node: ArrayNode) {
		for (const child of node.children) {
			this.parseValueNode(child);
		}
	}

	private parseLiteralNode(valueNode: LiteralNode, keyNode?: IdentifierNode) {
		const fieldValue = valueNode.value;

		if (typeof fieldValue !== "string") {
			return;
		}

		const range = createRange(valueNode);
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
