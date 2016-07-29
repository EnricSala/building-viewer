package mcia.building.viewer.controller;

import mcia.building.viewer.domain.Point;
import mcia.building.viewer.metrics.MetricsRepository;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import rx.Observable;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@WebMvcTest(MetricsController.class)
public class MetricsControllerTest {

	@Autowired
	private MockMvc mvc;

	@MockBean
	private MetricsRepository metrics;

	@Ignore
	@Test
	public void shouldQuerySingleSerie() throws Exception {
		List<String> series = Arrays.asList("test1");
		Map<String, Point> result = new HashMap<>();
		result.put("test1", new Point(1000, 24.7));

		given(metrics.queryLastPoint(series))
				.willReturn(Observable.just(result));

		mvc
				.perform(
						post("/api/metrics/current")
								.contentType(MediaType.APPLICATION_JSON)
								.content("{\"metricIds\": [\"test1\"]}"))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"points\": {\"test1\": {\"time\": 1000, \"value\": 24.7}}}"));
		// TODO find out why this test doesn't work
	}

	@Ignore
	@Test
	public void shouldFail400WhenUnknownMetricId() throws Exception {
		List<String> series = Arrays.asList("unknown");

		given(metrics.queryLastPoint(series))
				.willThrow(new RuntimeException("unknown metricId"));

		mvc
				.perform(
						post("/api/metrics/current")
								.contentType(MediaType.APPLICATION_JSON)
								.content("{\"metricIds\": [\"unknown\"]}"))
				.andExpect(status().is4xxClientError());
		// TODO make this test pass
	}

}
