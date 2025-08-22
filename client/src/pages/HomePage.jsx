import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Card className="pt-5">
        <CardContent>
          <h1 className="text-center text-2xl font-bold mb-5">
            Welcome to H2N Shop
          </h1>
          <div className="flex justify-center gap-10">
            <Button>
              <Link to="/login">Login</Link>
            </Button>
            <Button>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
