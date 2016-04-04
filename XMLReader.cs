/*
 * Author: Isaiah Mann
 * Used to read in XML documents from text. Parses them to a simple treelike structure storing strings
 */
using UnityEngine;
using System.Xml;
using System.Collections;

public static class XMLReader {
	const char _openingChevron = '<';
	const char _closingChevron = '>';

	// File path should be a subdirectory of the Resources folder
	public static XmlDocument Read (string filePath) {
		return Read(Resources.Load<TextAsset>(filePath));
	}

	public static XmlDocument Read (TextAsset xmlDoc) {
		return ReadFromString (xmlDoc.text);
	}

	public static XmlDocument ReadFromString (string xmlAsString) {

		XmlDocument document = new XmlDocument();

		document.LoadXml(xmlAsString);

		return document;
	}

	// Data tree is a simple implementation of a tree structure that holds strings in its nodes
	public static DataTree ReadXMLAsDataTree (XmlDocument document) {
		DataTree tree = new DataTree();
		DataNode root = tree.Root;

		// Recursive Call
		ReadNode (document.DocumentElement, ref root);

		return tree;
	}

	// Recursive Function
	public static void ReadNode (XmlNode xmlNode, ref DataNode dataWriteNode) {
		dataWriteNode.Value =
			xmlNode.Value == null ?
			getLeadingTag(xmlNode) :
			xmlNode.Value.Trim(); // Eliminates white space in XML text

		// Leverages the XML object's treelike structure to scoop data into the more accessible DataTree structure
		if (xmlNode.HasChildNodes) {

			foreach (XmlNode childXMLNode in xmlNode.ChildNodes) {

				DataNode newDataNode = new DataNode("");

				dataWriteNode.AddChild (newDataNode);

				// Recursive call to read the nodes in a depth first traversal
				ReadNode(
					childXMLNode,
					ref newDataNode
				);
			}
		}
	}

	// Utility function to check whether a node is storing a value
	static bool hasValue (XmlNode xmlNode) {
		return xmlNode.Value != null;
	}

	// Utility function: parses outermost tag from a chunk of XML code
	static string getLeadingTag (XmlNode xmlNode) {
		if (beginsWithTag(xmlNode)) {

			string xmlNodeAsString = xmlNode.OuterXml;

			int stringPointer = 1;

			while (xmlNodeAsString[stringPointer] != _closingChevron) {
				stringPointer++;
			}

			return xmlNodeAsString.Substring(1, stringPointer-1);

		} else {

			Debug.LogWarning("XML code invalid. No tag found");

			return null;

		}

	}

	static bool beginsWithTag (XmlNode xmlNode) {
		string xmlAsString = xmlNode.OuterXml;

		if (xmlAsString[0] != _openingChevron) {
			return false;
		}

		for (int i = 1; i < xmlAsString.Length; i++) {
			if (xmlAsString[i] == _closingChevron) {
				return true;
			}
		}

		return false;
	}
}
