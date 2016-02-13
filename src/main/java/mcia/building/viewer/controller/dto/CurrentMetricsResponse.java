package mcia.building.viewer.controller.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import mcia.building.viewer.domain.Point;

@Data
@AllArgsConstructor
public class CurrentMetricsResponse {

	private Map<String, Point> points;

}
