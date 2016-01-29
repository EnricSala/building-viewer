package mcia.building.viewer.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Point {

	private String id;

	private long time;

	private double value;

}
