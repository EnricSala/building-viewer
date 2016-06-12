package mcia.building.viewer.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Point {

	private long time;

	private double value;

}
