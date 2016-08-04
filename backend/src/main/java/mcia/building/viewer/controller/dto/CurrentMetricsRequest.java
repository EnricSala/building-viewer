package mcia.building.viewer.controller.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class CurrentMetricsRequest {

	@NotNull
	private List<String> metricIds;

}
