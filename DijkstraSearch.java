/*
 * Author: Isaiah Mann
 * Description: An implementation of Dijkstra's Algorithm for finding the shortest path in a graph
*/

package imann.graphvisualization.graph;

import imann.graphvisualization.gui.GraphGUI;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;


//shortest path algorithm
//uses hashmaps for costs and predessors 
public class DijkstraSearch extends Search {
	private Map <String, Integer> costs = new HashMap<String, Integer>();
	private Map <String, String> predecessors = new HashMap <String, String>();
	public DijkstraSearch(Graph graph, GraphGUI gui) {
		super(graph, gui);
		for (String s : graph.getNodes())
			costs.put(s, Integer.MAX_VALUE);
	}
	
	public List<String> search (String start, String goal, LinkedList<List<String>> nodes) {  
		costs.put(start, 0);
		PriorityQueue <String> unvisited = new PriorityQueue<String>(graph.getNodes().size(), new LowestValue());
		for (String s : graph.getNodes())
			unvisited.add(s);

		while (!unvisited.isEmpty()) {
			String u = unvisited.peek();
			try {
				for (String s : graph.getNeighbors(u)) {
					int alt = costs.get(u) + gui.length(s, u);
					if (alt < costs.get(s)) {
						costs.put(s, alt);
						predecessors.put(s, u);
					}
				}
			} catch (NoSuchNodeException e) {
				e.printStackTrace();
			} finally {
				unvisited.poll();
			} 
		}
		
		List<String> path = new LinkedList<String>();
		String curNode = goal;
		do {
			((LinkedList<String>) path).addFirst(curNode);
			curNode = predecessors.get(curNode);
		} while (curNode != null);
		return path;
	}
	
	
	//comparator to ensure the priority queue promotes the lowest cost node
	class LowestValue implements Comparator <String> {
		public int compare (String str, String str2) {
			return Integer.compare(costs.get(str), costs.get(str2));
		}
	}

}
