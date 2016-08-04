package mcia.building.viewer.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import mcia.building.viewer.domain.Point;

import java.util.Map;

@Data
@AllArgsConstructor
public class CurrentMetricsResponse {

	private Map<String, Point> points;

}
