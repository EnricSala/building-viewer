package mcia.building.viewer.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NamedPoint {

	private String id;

	private Point point;

	public NamedPoint(String id, long time, double value) {
		this.id = id;
		this.point = new Point(time, value);
	}

}
