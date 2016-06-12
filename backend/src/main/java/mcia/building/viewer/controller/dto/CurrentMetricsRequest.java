package mcia.building.viewer.controller.dto;

import java.util.List;

import lombok.Data;

@Data
public class CurrentMetricsRequest {

	private List<String> metricIds;

}
