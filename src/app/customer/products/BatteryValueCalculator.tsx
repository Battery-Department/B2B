'use client';

import React from 'react';
import Tooltip from './Tooltip';
import { Calculator, Activity, Clock, Zap } from 'lucide-react';

interface BatteryValueCalculatorProps {
  quantities: { [key: string]: number };
  batterySpecs: { [key: string]: any };
  isMobile: boolean;
}

const BatteryValueCalculator: React.FC<BatteryValueCalculatorProps> = ({ 
  quantities, 
  batterySpecs,
  isMobile 
}) => {
  // Calculate total Ah
  const calculateTotalAh = () => {
    let total = 0;
    Object.entries(quantities).forEach(([type, quantity]) => {
      const ahValue = parseInt(type);
      total += ahValue * quantity;
    });
    return total;
  };

  const totalAh = calculateTotalAh();
  
  // Tool runtime calculations based on amp-hour consumption
  const toolConsumption = {
    circularSaw: { name: "Circular Saw", ahPerHour: 5 },
    drill: { name: "Drill", ahPerHour: 2 },
    impactDriver: { name: "Impact Driver", ahPerHour: 3 },
    grinder: { name: "Angle Grinder", ahPerHour: 4.5 },
    recipSaw: { name: "Reciprocating Saw", ahPerHour: 6 },
    jigsaw: { name: "Jigsaw", ahPerHour: 2.5 }
  };

  const calculateToolHours = (tool: any) => {
    return Math.round(totalAh / tool.ahPerHour);
  };

  if (totalAh === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #F0F9FF 0%, #E6F4FF 100%)",
      border: "1px solid #BAE0FF",
      borderRadius: "12px",
      padding: isMobile ? "16px" : "20px",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Pattern */}
      <div style={{
        position: "absolute",
        right: -50,
        top: -50,
        width: 200,
        height: 200,
        background: "radial-gradient(circle, rgba(0, 111, 238, 0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />
      
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px"
      }}>
        <Calculator size={20} color="#006FEE" />
        <h3 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#003D88",
          margin: 0
        }}>Battery Value Calculator</h3>
      </div>

      <div style={{
        marginBottom: "20px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.7)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{
          fontSize: "16px",
          color: "#64748B",
          fontWeight: "500"
        }}>Total Power Capacity:</span>
        <span style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#006FEE"
        }}>{totalAh}Ah</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: "12px"
      }}>
        {[
          toolConsumption.circularSaw,
          toolConsumption.drill,
          toolConsumption.impactDriver
        ].map((tool, index) => {
          const hours = calculateToolHours(tool);
          const tooltipContent = `Based on typical ${tool.name} usage at ${tool.ahPerHour}Ah per hour. Actual runtime varies with workload intensity. This calculation assumes continuous operation at moderate load.`;
          
          return (
            <Tooltip key={index} content={tooltipContent} position="top">
              <div
                style={{
                  background: "white",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  cursor: "help",
                  transition: "all 0.2s",
                  border: "1px solid transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "1px solid #006FEE";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 111, 238, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Clock size={16} color="#006FEE" style={{ marginBottom: "4px" }} />
                <div style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#006FEE",
                  marginBottom: "4px"
                }}>{hours} hours</div>
                <div style={{
                  fontSize: "13px",
                  color: "#64748B"
                }}>{tool.name}</div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div style={{
        marginTop: "16px",
        padding: "12px",
        background: "rgba(16, 185, 129, 0.1)",
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <p style={{
          fontSize: "14px",
          color: "#10B981",
          fontWeight: "600",
          margin: 0
        }}>
          Your batteries can power a full crew's tools for {Math.round(totalAh / 15)} full workdays
        </p>
      </div>
    </div>
  );
};

export default BatteryValueCalculator;