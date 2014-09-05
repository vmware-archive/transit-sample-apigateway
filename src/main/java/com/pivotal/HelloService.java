package com.pivotal;

import org.springframework.stereotype.Component;

@Component
public class HelloService {

    public String getHelloMessage() {
        return "Hello from a Spring Bean!";
    }

}
