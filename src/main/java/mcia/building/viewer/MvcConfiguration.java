package mcia.building.viewer;

import java.util.List;

import org.hibernate.validator.constraints.NotEmpty;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodReturnValueHandler;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import mcia.building.viewer.rx.RxObservableReturnValueHandler;

@Configuration
@ConfigurationProperties("files")
@Slf4j
public class MvcConfiguration extends WebMvcConfigurerAdapter implements InitializingBean {

	@NotEmpty
	private @Setter String buildingsPath;

	@NotEmpty
	private @Setter String layersPath;

	@Override
	public void afterPropertiesSet() throws Exception {
		log.info("Buildings path: {}", buildingsPath);
		log.info("Layers path: {}", layersPath);
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/buildings/**").addResourceLocations("file:/" + buildingsPath);
		registry.addResourceHandler("/layers/**").addResourceLocations("file:/" + layersPath);
	}

	@Override
	public void addReturnValueHandlers(List<HandlerMethodReturnValueHandler> returnValueHandlers) {
		returnValueHandlers.add(new RxObservableReturnValueHandler());
	}

}
